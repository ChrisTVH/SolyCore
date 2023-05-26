const deafen = require("../shared/deafen");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "deafen",
  description: "ensordecer al miembro especificado en los canales de voz",
  category: "MODERATION",
  userPermissions: ["DeafenMembers"],
  botPermissions: ["DeafenMembers"],
  command: {
    enabled: true,
    usage: "<ID|@miembro> [razón]",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No se ha encontrado ningún usuario que coincida ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await deafen(message, target, reason);
    await message.safeReply(response);
  },
};
