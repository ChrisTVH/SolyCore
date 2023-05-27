/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "leaveserver",
  description: "abandonar un servidor.",
  category: "OWNER",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    usage: "<IdDelServidor>",
  },
  slashCommand: {
    enabled: false,
  },

  async messageRun(message, args, data) {
    const input = args[0];
    const guild = message.client.guilds.cache.get(input);
    if (!guild) {
      return message.safeReply(
        `No se ha encontrado ningún servidor. Por favor, proporcione una Id de servidor válida.
        Puede utilizar ${data.prefix}findserver/${data.prefix}listservers para encontrar el id del servidor`
      );
    }

    const name = guild.name;
    try {
      await guild.leave();
      return message.safeReply(`Abandonado con éxito \`${name}\``);
    } catch (err) {
      message.client.logger.error("Servidor Abandonado", err);
      return message.safeReply(`Fallo al abandonar \`${name}\``);
    }
  },
};
