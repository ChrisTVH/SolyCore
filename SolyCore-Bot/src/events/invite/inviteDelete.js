const { getInviteCache } = require("@handlers/invite");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (client, invite) => {
  const cachedInvites = getInviteCache(invite?.guild);

  // Comprobar si el código de invitación existe en la caché
  if (cachedInvites && cachedInvites.get(invite.code)) {
    cachedInvites.get(invite.code).deletedTimestamp = Date.now();
  }
};
