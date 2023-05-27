const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getMemberStats } = require("@schemas/MemberStats");
const { EMBED_COLORS } = require("@root/config");
const { stripIndents } = require("common-tags");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "stats",
  description: "muestra las estadísticas de los miembros de este servidor",
  cooldown: 5,
  category: "STATS",
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
    const target = (await message.guild.resolveMember(args[0])) || message.member;
    const response = await stats(target, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const member = interaction.options.getMember("user") || interaction.member;
    const response = await stats(member, data.settings);
    await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').GuildMember} member
 * @param {object} settings
 */
async function stats(member, settings) {
  if (!settings.stats.enabled) return "El seguimiento de estadísticas está desactivado en este servidor";
  const memberStats = await getMemberStats(member.guild.id, member.id);

  const embed = new EmbedBuilder()
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addFields(
      {
        name: "Etiqueta de Usuario",
        value: member.user.tag,
        inline: true,
      },
      {
        name: "ID",
        value: member.id,
        inline: true,
      },
      {
        name: "⌚ Miembro desde",
        value: member.joinedAt.toLocaleString(),
        inline: false,
      },
      {
        name: "💬 Mensajes enviados",
        value: stripIndents`
      ❯ Mensajes enviados: ${memberStats.messages}
      ❯ Prefijo de Comandos: ${memberStats.commands.prefix}
      ❯ Comandos de Slash: ${memberStats.commands.slash}
      ❯ EXP Ganada: ${memberStats.xp}
      ❯ Nivel Actual: ${memberStats.level}
    `,
        inline: false,
      },
      {
        name: "🎙️ Estadísticas de voz",
        value: stripIndents`
      ❯ Conexiones totales: ${memberStats.voice.connections}
      ❯ Tiempo empleado: ${Math.floor(memberStats.voice.time / 60)} mins
    `,
      }
    )
    .setFooter({ text: "Estadísticas generadas" })
    .setTimestamp();

  return { embeds: [embed] };
}
