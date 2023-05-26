/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 * @param {number} addDuration
 * @param {string} newPrize
 * @param {number} newWinnerCount
 */
module.exports = async (member, messageId, addDuration, newPrize, newWinnerCount) => {
  if (!messageId) return "Debe proporcionar un identificador de mensaje v�lido.";

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

  try {
    await member.client.giveawaysManager.edit(messageId, {
      addTime: addDuration || 0,
      newPrize: newPrize || giveaway.prize,
      newWinnerCount: newWinnerCount || giveaway.winnerCount,
    });

    return `�Actualizado con �xito el sorteo!`;
  } catch (error) {
    member.client.logger.error("Edici�n del sorteo", error);
    return `Se ha producido un error al actualizar el sorteo: ${error.message}`;
  }
};
