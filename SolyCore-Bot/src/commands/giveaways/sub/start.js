const { ChannelType } = require("discord.js");

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').GuildTextBasedChannel} giveawayChannel
 * @param {number} duration
 * @param {string} prize
 * @param {number} winners
 * @param {import('discord.js').User} [host]
 * @param {string[]} [allowedRoles]
 */
module.exports = async (member, giveawayChannel, duration, prize, winners, host, allowedRoles = []) => {
  try {
    if (!host) host = member.user;
    if (!member.permissions.has("ManageMessages")) {
      return "Necesitas tener permisos de gestión de mensajes para iniciar sorteos.";
    }

    if (!giveawayChannel.type === ChannelType.GuildText) {
      return "Sólo puedes iniciar sorteos en canales de texto.";
    }

    /**
     * @type {import("discord-giveaways").GiveawayStartOptions}
     */
    const options = {
      duration: duration,
      prize,
      winnerCount: winners,
      hostedBy: host,
      thumbnail: "https://cdn.discordapp.com/attachments/1038077615275266108/1112054396742811699/Gift.png",
      messages: {
        giveaway: "🎉 **Sorteo** 🎉",
        giveawayEnded: "🎉 **Sorteo Finalizado** 🎉",
        inviteToParticipate: "Reacciona con 🎁 para participar",
        drawing: 'Soltado: {timestamp}',
        dropMessage: "Sé el primero en reaccionar con 🎁 ¡Para Ganar!",
        hostedBy: `\nPresentado por: ${host.tag}`,
        embedFooter: '{this.winnerCount} ganador(es)',
      },
    };

    if (allowedRoles.length > 0) {
      options.exemptMembers = (member) => !member.roles.cache.find((role) => allowedRoles.includes(role.id));
    }

    await member.client.giveawaysManager.start(giveawayChannel, options);
    return `El sorteo comenzó en ${giveawayChannel}`;
  } catch (error) {
    member.client.logger.error("Inicio del sorteo", error);
    return `Se ha producido un error al iniciar el sorteo: ${error.message}`;
  }
};
