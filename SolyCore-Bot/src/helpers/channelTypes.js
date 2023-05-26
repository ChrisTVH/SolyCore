const { ChannelType } = require("discord.js");

/**
 * @param {number} type
 */
module.exports = (type) => {
  switch (type) {
    case ChannelType.GuildText:
      return "Canal de Texto";
    case ChannelType.GuildVoice:
      return "Canal de Voz";
    case ChannelType.GuildCategory:
      return "Categoria del Servidor";
    case ChannelType.GuildAnnouncement:
      return "Canal de Anuncio";
    case ChannelType.AnnouncementThread:
      return "Hilo de canal de Anuncio";
    case ChannelType.PublicThread:
      return "Hilo publico de Canal";
    case ChannelType.PrivateThread:
      return "Hilo privado de Canal";
    case ChannelType.GuildStageVoice:
      return "Escenario de Canal de Voz";
    case ChannelType.GuildDirectory:
      return "Directorio del Servidor";
    case ChannelType.GuildForum:
      return "Foro del Canal";
    default:
      return "Desconocido";
  }
};
