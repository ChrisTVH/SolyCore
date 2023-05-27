const config = require("@root/config");

module.exports = {
  ADMIN: {
    name: "Administración",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111649863512358912/Admin.png",
    emoji: "⚙️",
  },
  AUTOMOD: {
    name: "Automoderación",
    enabled: config.AUTOMOD.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111649946060456069/automod.png",
    emoji: "🤖",
  },
  ANIME: {
    name: "Anime Básico",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650001970544680/Anime.png",
    emoji: "🎨",
  },
  ECONOMY: {
    name: "Economía Básica",
    enabled: config.ECONOMY.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650062196539422/Economy.png",
    emoji: "🪙",
  },
  FUN: {
    name: "Entretenimiento Básicp",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650170141155378/Fun.png",
    emoji: "😂",
  },
  GIVEAWAY: {
    name: "Sistema de Sorteos",
    enabled: config.GIVEAWAYS.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650241326891088/Giveaway.png",
    emoji: "🎉",
  },
  IMAGE: {
    name: "Manipulación de Imágenes",
    enabled: config.IMAGE.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650302572109916/Image.png",
    emoji: "🖼️",
  },
  INVITE: {
    name: "Sistema de invitaciones",
    enabled: config.INVITE.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650413150744706/Invite.png",
    emoji: "📨",
  },
  INFORMATION: {
    name: "Información",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650858099298335/Information.png",
    emoji: "🪧",
  },
  MODERATION: {
    name: "Sistema de moderación",
    enabled: config.MODERATION.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111650990467326003/Moderation.png",
    emoji: "🔨",
  },
  MUSIC: {
    name: "Reproductor de música",
    enabled: config.MUSIC.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651014202896494/Music.png",
    emoji: "🎵",
  },
  OWNER: {
    name: "Propietario",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651122499817513/Owner.png",
    emoji: "🤴",
  },
  SOCIAL: {
    name: "Reputación",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651171568980039/Social.png",
    emoji: "🫂",
  },
  STATS: {
    name: "Estadísticas",
    enabled: config.STATS.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651227688779786/Stats.png",
    emoji: "📈",
  },
  SUGGESTION: {
    name: "Sistema de Sugerencias",
    enabled: config.SUGGESTIONS.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651311335784478/Suggestions.png",
    emoji: "📝",
  },
  TICKET: {
    name: "Sistema de Tickets",
    enabled: config.TICKET.ENABLED,
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651369145872444/Ticket.png",
    emoji: "🎫",
  },
  UTILITY: {
    name: "Utilidades",
    image: "https://cdn.discordapp.com/attachments/1038077615275266108/1111651428075839569/Utility.png",
    emoji: "🛠",
  },
};
