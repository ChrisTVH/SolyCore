const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (member) => {
  // Permisos
  if (!member.permissions.has("ManageMessages")) {
      return "Necesitas tener permisos de gestión de mensajes para gestionar sorteos.";
  }

  // Buscar en todos los sorteos
  const giveaways = member.client.giveawaysManager.giveaways.filter(
    (g) => g.guildId === member.guild.id && g.ended === false
  );

  // No hay sorteos
  if (giveaways.length === 0) {
      return "En este servidor no se realizan sorteos.";
  }

  const description = giveaways.map((g, i) => `${i + 1}. ${g.prize} in <#${g.channelId}>`).join("\n");

  try {
    return { embeds: [{ description, color: EMBED_COLORS.GIVEAWAYS }] };
  } catch (error) {
    member.client.logger.error("Lista de sorteos", error);
    return `Se ha producido un error al listar los sorteos: ${error.message}`;
  }
};
