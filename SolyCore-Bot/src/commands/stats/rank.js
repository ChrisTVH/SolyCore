const { AttachmentBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS, IMAGE } = require("@root/config");
const { getBuffer } = require("@helpers/HttpUtils");
const { getMemberStats, getXpLb } = require("@schemas/MemberStats");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "rank",
  description: "muestra el rango de los miembros en este servidor",
  cooldown: 5,
  category: "STATS",
  botPermissions: ["AttachFiles"],
  command: {
    enabled: true,
    usage: "[@miembro|id]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "usuario objetivo",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args, data) {
    const member = (await message.guild.resolveMember(args[0])) || message.member;
    const response = await getRank(message, member, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(user);
    const response = await getRank(interaction, member, data.settings);
    await interaction.followUp(response);
  },
};

async function getRank({ guild }, member, settings) {
  const { user } = member;
  if (!settings.stats.enabled) return "El seguimiento de estadísticas está desactivado en este servidor";

  const memberStats = await getMemberStats(guild.id, user.id);
  if (!memberStats.xp) return `${user.tag} ¡aún no está clasificado!`;

  const lb = await getXpLb(guild.id, 100);
  let pos = -1;
  lb.forEach((doc, i) => {
    if (doc.member_id == user.id) {
      pos = i + 1;
    }
  });

  const xpNeeded = memberStats.level * memberStats.level * 100;

  const url = new URL(`${IMAGE.BASE_API}/utils/rank-card`);
  url.searchParams.append("nombre", user.username);
  url.searchParams.append("discriminador", user.discriminator);
  url.searchParams.append("avatar", user.displayAvatarURL({ extension: "png", size: 128 }));
  url.searchParams.append("exp actual", memberStats.xp);
  url.searchParams.append("expreq", xpNeeded);
  url.searchParams.append("nivel", memberStats.level);
  url.searchParams.append("barcolor", EMBED_COLORS.BOT_EMBED);
  url.searchParams.append("estado", member?.presence?.status?.toString() || "idle");
  if (pos !== -1) url.searchParams.append("rank", pos);

  const response = await getBuffer(url.href, {
    headers: {
      Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
    },
  });
  if (!response.success) return "Error al generar la tarjeta de rango";

  const attachment = new AttachmentBuilder(response.buffer, { name: "rank.png" });
  return { files: [attachment] };
}
