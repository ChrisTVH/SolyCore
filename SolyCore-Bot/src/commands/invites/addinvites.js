const { getEffectiveInvites, checkInviteRewards } = require("@handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getMember } = require("@schemas/Member");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "addinvites",
    description: "añadir invitaciones a un miembro",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<@miembro|id> <invitación>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "el usuario al que invitar",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "invites",
        description: "el número de invitaciones a dar",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    const amount = parseInt(args[1]);

    if (!target) return message.safeReply("Sintaxis incorrecta. Debe mencionar un objetivo");
    if (isNaN(amount)) return message.safeReply("El importe de la invitación debe ser un número");

    const response = await addInvites(message, target.user, parseInt(amount));
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("invites");
    const response = await addInvites(interaction, user, amount);
    await interaction.followUp(response);
  },
};

async function addInvites({ guild }, user, amount) {
  if (user.bot) return "¡Uy! No se pueden añadir invitaciones a bots";

  const memberDb = await getMember(guild.id, user.id);
  memberDb.invite_data.added += amount;
  await memberDb.save();

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Invitaciones añadidas a ${user.username}` })
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${user.tag} ahora tiene ${getEffectiveInvites(memberDb.invite_data)} invitaciones`);

  checkInviteRewards(guild, memberDb, true);
  return { embeds: [embed] };
}
