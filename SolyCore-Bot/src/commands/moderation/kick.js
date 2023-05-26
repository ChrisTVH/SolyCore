const { kickTarget } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "kick",
  description: "expulsa el miembro especificado",
  category: "MODERATION",
  botPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
  command: {
    enabled: true,
    usage: "<ID|@miembro> [razón]",
    minArgsCount: 1,
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
        name: "reason",
        description: "razón de la expulsión",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No se ha encontrado ningún usuario que coincida ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await kick(message.member, target, reason);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await kick(interaction.member, target, reason);
    await interaction.followUp(response);
  },
};

async function kick(issuer, target, reason) {
  const response = await kickTarget(issuer, target, reason);
  if (typeof response === "boolean") return `${target.user.tag} ¡está expulsado!`;
  if (response === "BOT_PERM") return `No tengo permiso para expulsar ${target.user.tag}`;
  else if (response === "MEMBER_PERM") return `No tienes permiso para expulsar ${target.user.tag}`;
  else return `Fallo al expulsar ${target.user.tag}`;
}
