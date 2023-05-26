const { getInviteCache, cacheInvite } = require("@handlers/invite");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (client, invite) => {
  const cachedInvites = getInviteCache(invite?.guild);

  // Comprobar si la caché del servidor existe y luego añadirlo a la caché
  if (cachedInvites) {
    cachedInvites.set(invite.code, cacheInvite(invite, false));
  }
};
