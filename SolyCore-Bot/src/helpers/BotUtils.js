const { getJson } = require("@helpers/HttpUtils");
const { success, warn, error } = require("@helpers/Logger");

module.exports = class BotUtils {
  /**
   * Comprueba si el bot está actualizado
   */
  static async checkForUpdates() {
    const response = await getJson("https://api.github.com/repos/saiteja-madha/discord-js-bot/releases/latest");
    if (!response.success) return error("VersionCheck: Falló la comprobación de actualizaciones del bot");
    if (response.data) {
      if (
        require("@root/package.json").version.replace(/[^0-9]/g, "") >= response.data.tag_name.replace(/[^0-9]/g, "")
      ) {
        success("Comprobación de versión: Tu bot de discord está actualizado");
      } else {
        warn(`ComprobarVersión: ${response.data.tag_name} actualización disponible`);
        warn("descarga: https://github.com/saiteja-madha/discord-js-bot/releases/latest");
      }
    }
  }

  /**
   * Obtener la url de la imagen del mensaje
   * @param {import('discord.js').Message} message
   * @param {string[]} args
   */
  static async getImageFromMessage(message, args) {
    let url;

    // compruebe si hay archivos adjuntos
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      const attachUrl = attachment.url;
      const attachIsImage = attachUrl.endsWith(".png") || attachUrl.endsWith(".jpg") || attachUrl.endsWith(".jpeg");
      if (attachIsImage) url = attachUrl;
    }

    if (!url && args.length === 0) url = message.author.displayAvatarURL({ size: 256, extension: "png" });

    if (!url && args.length !== 0) {
      try {
        url = new URL(args[0]).href;
      } catch (ex) {
        /* Ignorar */
      }
    }

    if (!url && message.mentions.users.size > 0) {
      url = message.mentions.users.first().displayAvatarURL({ size: 256, extension: "png" });
    }

    if (!url) {
      const member = await message.guild.resolveMember(args[0]);
      if (member) url = member.user.displayAvatarURL({ size: 256, extension: "png" });
    }

    if (!url) url = message.author.displayAvatarURL({ size: 256, extension: "png" });

    return url;
  }

  static get musicValidations() {
    return [
      {
        callback: ({ client, guildId }) => client.musicManager.getPlayer(guildId),
        message: "🚫 No hay música.",
      },
      {
        callback: ({ member }) => member.voice?.channelId,
        message: "🚫 Tienes que unirte a mi canal de voz.",
      },
      {
        callback: ({ member, client, guildId }) =>
          member.voice?.channelId === client.musicManager.getPlayer(guildId)?.channelId,
        message: "🚫 No estás en el mismo canal de voz.",
      },
    ];
  }
};
