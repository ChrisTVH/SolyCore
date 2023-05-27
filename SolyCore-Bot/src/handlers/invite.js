const { Collection } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { getMember } = require("@schemas/Member");

const inviteCache = new Collection();

const getInviteCache = (guild) => inviteCache.get(guild.id);
const resetInviteCache = (guild) => inviteCache.delete(guild.id);

const getEffectiveInvites = (inviteData = {}) =>
  inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left || 0;

const cacheInvite = (invite, isVanity) => ({
  code: invite.code,
  uses: invite.uses,
  maxUses: invite.maxUses,
  inviterId: isVanity ? "VANITY" : invite.inviter?.id,
});

/**
 * Esta función almacena en caché todas las invitaciones para el servidor proporcionado
 * @param {import("discord.js").Guild} guild
 */
async function cacheGuildInvites(guild) {
  if (!guild.members.me.permissions.has("ManageGuild")) return new Collection();
  const invites = await guild.invites.fetch();

  const tempMap = new Collection();
  invites.forEach((inv) => tempMap.set(inv.code, cacheInvite(inv)));
  if (guild.vanityURLCode) {
    tempMap.set(guild.vanityURLCode, cacheInvite(await guild.fetchVanityData(), true));
  }

  inviteCache.set(guild.id, tempMap);
  return tempMap;
}

/**
 * Añadir roles a inviter en función del número de invitaciones
 * @param {import("discord.js").Guild} guild
 * @param {Object} inviterData
 * @param {boolean} isAdded
 */
const checkInviteRewards = async (guild, inviterData = {}, isAdded) => {
  const settings = await getSettings(guild);
  if (settings.invite.ranks.length > 0 && inviterData?.member_id) {
    const inviter = await guild.members.fetch(inviterData?.member_id).catch(() => {});
    if (!inviter) return;

    const invites = getEffectiveInvites(inviterData.invite_data);
    settings.invite.ranks.forEach((reward) => {
      if (isAdded) {
        if (invites >= reward.invites && !inviter.roles.cache.has(reward._id)) {
          inviter.roles.add(reward._id);
        }
      } else if (invites < reward.invites && inviter.roles.cache.has(reward._id)) {
        inviter.roles.remove(reward._id);
      }
    });
  }
};

/**
 * Rastrear al invitante comparando las nuevas invitaciones con las almacenadas en caché
 * @param {import("discord.js").GuildMember} member
 */
async function trackJoinedMember(member) {
  const { guild } = member;

  if (member.user.bot) return {};

  const cachedInvites = inviteCache.get(guild.id);
  const newInvites = await cacheGuildInvites(guild);

  // devolver si no hay datos en caché
  if (!cachedInvites) return {};
  let usedInvite;

  // compare newInvites with cached invites
  usedInvite = newInvites.find(
    (inv) => inv.uses !== 0 && cachedInvites.get(inv.code) && cachedInvites.get(inv.code).uses < inv.uses
  );

  // Caso especial: La invitación se borró después de la llegada del miembro y
  // justo antes de GUILD_MEMBER_ADD (https://github.com/Androz2091/discord-invites-tracker/blob/29202ee8e85bb1651f19a466e2c0721b2373fefb/index.ts#L46)
  if (!usedInvite) {
    cachedInvites
      .sort((a, b) => (a.deletedTimestamp && b.deletedTimestamp ? b.deletedTimestamp - a.deletedTimestamp : 0))
      .forEach((invite) => {
        if (
          !newInvites.get(invite.code) && // Si la invitación ya no existe
          invite.maxUses > 0 && // Si la invitación era realmente una invitación con un número limitado de usos
          invite.uses === invite.maxUses - 1 // ¿Y si la invitación estuviera a punto de alcanzar el número máximo de usos
        ) {
          usedInvite = invite;
        }
      });
  }

  let inviterData = {};
  if (usedInvite) {
    const inviterId = usedInvite.code === guild.vanityURLCode ? "VANITY" : usedInvite.inviterId;

    // registrar datos de invitación
    const memberDb = await getMember(guild.id, member.id);
    memberDb.invite_data.inviter = inviterId;
    memberDb.invite_data.code = usedInvite.code;
    await memberDb.save();

    // incrementar las invitaciones
    const inviterDb = await getMember(guild.id, inviterId);
    inviterDb.invite_data.tracked += 1;
    await inviterDb.save();
    inviterData = inviterDb;
  }

  checkInviteRewards(guild, inviterData, true);
  return inviterData;
}

/**
 * Obtención de datos de la base de datos
 * @param {import("discord.js").Guild} guild
 * @param {import("discord.js").User} user
 */
async function trackLeftMember(guild, user) {
  if (user.bot) return {};

  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return;
  const inviteData = (await getMember(guild.id, user.id)).invite_data;

  let inviterData = {};
  if (inviteData.inviter) {
    const inviterId = inviteData.inviter === "VANITY" ? "VANITY" : inviteData.inviter;
    const inviterDb = await getMember(guild.id, inviterId);
    inviterDb.invite_data.left += 1;
    await inviterDb.save();
    inviterData = inviterDb;
  }

  checkInviteRewards(guild, inviterData, false);
  return inviterData;
}

module.exports = {
  getInviteCache,
  resetInviteCache,
  trackJoinedMember,
  trackLeftMember,
  cacheGuildInvites,
  checkInviteRewards,
  getEffectiveInvites,
  cacheInvite,
};
