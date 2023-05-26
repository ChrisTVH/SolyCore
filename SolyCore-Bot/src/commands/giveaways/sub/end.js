/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
    if (!messageId) return "Debe proporcionar un ID de mensaje v�lido.";

  // Permisos
  if (!member.permissions.has("ManageMessages")) {
    return "Necesitas tener permisos de gesti�n de mensajes para iniciar sorteos.";
  }

  // Buscar con mensajeId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // Si no se ha encontrado ning�n sorteo
  if (!giveaway) return `No se ha podido encontrar un sorteo para mensajeId: ${messageId}`;

  // Compruebe si el sorteo ha finalizado
  if (giveaway.ended) return "The giveaway has already ended.";

  try {
    await giveaway.end();
    return "��xito! El sorteo ha terminado.";
  } catch (error) {
      member.client.logger.error("Fin del sorteo", error);
    return `Se ha producido un error al finalizar el sorteo: ${error.message}`;
  }
};
