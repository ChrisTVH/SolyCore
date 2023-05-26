const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (client, member) => {
  if (!member || !member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  // Autorol
  if (settings.autorole) {
    const role = guild.roles.cache.get(settings.autorole);
    if (role) member.roles.add(role).catch((err) => {});
  }

  // Comprobar el contador para el canal
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type.toUpperCase()))) {
    if (member.user.bot) {
      settings.data.bots += 1;
      await settings.save();
    }
    if (!client.counterUpdateQueue.includes(guild.id)) client.counterUpdateQueue.push(guild.id);
  }

  // Comprobar si el rastreador de invitaciones esta habilitado
  const inviterData = settings.invite.tracking ? await inviteHandler.trackJoinedMember(member) : {};

  // Enviar mensaje de bienvenida
  greetingHandler.sendWelcome(member, inviterData);
};
