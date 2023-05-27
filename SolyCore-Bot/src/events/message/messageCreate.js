const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  const settings = await getSettings(message.guild);

  // gestor de comandos
  let isCommand = false;
  if (PREFIX_COMMANDS.ENABLED) {
    // buscar menciones de bots
    if (message.content.includes(`${client.user.id}`)) {
      message.channel.safeSend(`> Mi prefijo es \`${settings.prefix}\``);
    }

    if (message.content && message.content.startsWith(settings.prefix)) {
      const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }

  // gestor de estadísticas
  if (settings.stats.enabled) await statsHandler.trackMessageStats(message, isCommand, settings);

  // si no es un comando
  if (!isCommand) await automodHandler.performAutomod(message, settings);
};
