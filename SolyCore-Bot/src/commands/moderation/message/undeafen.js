const undeafen = require("../shared/undeafen");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "undeafen",
  description: "quitar ensordecer al miembro especificado en los canales de voz",
  category: "MODERATION",
  userPermissions: ["DeafenMembers"],
  botPermissions: ["DeafenMembers"],
  command: {
    enabled: true,
    usage: "<ID|@miembro> [raz�n]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No se ha encontrado ning�n usuario que coincida ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await undeafen(message, target, reason);
    await message.safeReply(response);
  },
};
