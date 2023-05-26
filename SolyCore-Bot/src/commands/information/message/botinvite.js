const botinvite = require("../shared/botinvite");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "botinvite",
  description: "te da una invitación del bot",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = botinvite(message.client);
    try {
      await message.author.send(response);
      return message.safeReply("¡Comprueba tu DM para ver mi información! :envelope_with_arrow:");
    } catch (ex) {
      return message.safeReply("No puedo enviarte mis datos. ¿Está abierto su DM?");
    }
  },
};
