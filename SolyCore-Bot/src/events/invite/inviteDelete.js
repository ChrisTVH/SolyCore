const { getInviteCache } = require("@handlers/invite");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (client, invite) => {
  const cachedInvites = getInviteCache(invite?.guild);

  // Comprobar si el c�digo de invitaci�n existe en la cach�
  if (cachedInvites && cachedInvites.get(invite.code)) {
    cachedInvites.get(invite.code).deletedTimestamp = Date.now();
  }
};
