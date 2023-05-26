/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "Debe proporcionar un ID de mensaje válido.";

  // Permisos
  if (!member.permissions.has("ManageMessages")) {
    return "Necesitas tener permisos de gestión de mensajes para iniciar sorteos.";
  }

  // Buscar con mensajeId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // Si no se ha encontrado ningún sorteo
  if (!giveaway) return `No se puede encontrar un sorteo para mensajeId: ${messageId}`;

  // Compruebe si el sorteo ha finalizado
  if (!giveaway.ended) return "El sorteo aún no ha terminado.";

  try {
    await giveaway.reroll();
    return "¡Sorteo renovado!";
  } catch (error) {
    member.client.logger.error("Volver a sortear", error);
    return `Se ha producido un error al repetir el sorteo: ${error.message}`;
  }
};
