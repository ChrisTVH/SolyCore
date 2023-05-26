/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "Debe proporcionar un identificador de mensaje v�lido.";

  // Permisos
  if (!member.permissions.has("ManageMessages")) {
    return "Necesitas tener permisos de gesti�n de mensajes para gestionar sorteos.";
  }

  // Buscar con mensajeId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // Si no se ha encontrado ning�n sorteo
  if (!giveaway) return `No se puede encontrar un sorteo para mensajeId: ${messageId}`;

  // Comprueba si el sorteo no est� pausado
  if (!giveaway.pauseOptions.isPaused) return "Este sorteo no est� pausado.";

  try {
    await giveaway.unpause();
    return "��xito! �Sorteo reanudado!";
  } catch (error) {
    member.client.logger.error("Sorteo reanudado", error);
    return `Se ha producido un error al reanudar el sorteo: ${error.message}`;
  }
};
