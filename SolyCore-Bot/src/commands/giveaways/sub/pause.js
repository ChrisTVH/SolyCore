/**
 * @param {import('discord.js').GuildMember} member
 * @param {string} messageId
 */
module.exports = async (member, messageId) => {
  if (!messageId) return "You must provide a valid message id.";

  // Permisos
  if (!member.permissions.has("ManageMessages")) {
    return "You need to have the manage messages permissions to manage giveaways.";
  }

  // Buscar con mensajeId
  const giveaway = member.client.giveawaysManager.giveaways.find(
    (g) => g.messageId === messageId && g.guildId === member.guild.id
  );

  // Si no se ha encontrado ning�n sorteo
  if (!giveaway) return `No se puede encontrar un sorteo para mensajeId: ${messageId}`;

  // Comprueba si el sorteo est� en pausa
  if (giveaway.pauseOptions.isPaused) return "Este sorteo ya est� en pausa.";

  try {
    await giveaway.pause();
      return "��xito! �Sorteo en pausa!";
  } catch (error) {
    member.client.logger.error("Pausa del sorteo", error);
    return `Se ha producido un error al pausar el sorteo: ${error.message}`;
  }
};
