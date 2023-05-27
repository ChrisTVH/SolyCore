const { timeoutTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");
const ems = require("enhanced-ms");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "timeout",
  description: "agota el tiempo de espera del miembro especificado",
  category: "MODERATION",
  botPermissions: ["ModerateMembers"],
  userPermissions: ["ModerateMembers"],
  command: {
    enabled: true,
    aliases: ["mute"],
    usage: "<ID|@miembro> <duración> [razón]",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "el miembro objetivo",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "el tiempo de espera del miembro para",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "motivo del tiempo de espera",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No se ha encontrado ningún usuario que coincida ${args[0]}`);

    // tiempo de análisis
    const ms = ems(args[1]);
    if (!ms) return message.safeReply("Indique una duración válida. Ejemplo: 1d/1h/1m/1s");

    const reason = args.slice(2).join(" ").trim();
    const response = await timeout(message.member, target, ms, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");

    // tiempo de análisis
    const duration = interaction.options.getString("duration");
    const ms = ems(duration);
    if (!ms) return interaction.followUp("Indique una duración válida. Ejemplo: 1d/1h/1m/1s");

    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await timeout(interaction.member, target, ms, reason);
    await interaction.followUp(response);
  },
};

async function timeout(issuer, target, ms, reason) {
  if (isNaN(ms)) return "Indique una duración válida. Ejemplo: 1d/1h/1m/1s";
  const response = await timeoutTarget(issuer, target, ms, reason);
  if (typeof response === "boolean") return `${target.user.tag} se ha agotado el tiempo.`;
  if (response === "BOT_PERM") return `No tengo permiso para el tiempo de espera ${target.user.tag}`;
  else if (response === "MEMBER_PERM") return `Usted no tiene permiso para el tiempo de espera ${target.user.tag}`;
  else if (response === "ALREADY_TIMEOUT") return `${target.user.tag} ya ha expirado.`;
  else return `Fallo en el tiempo de espera ${target.user.tag}`;
}
