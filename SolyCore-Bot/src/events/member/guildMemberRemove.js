const { inviteHandler, greetingHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member
 */
module.exports = async (client, member) => {
  if (member.partial) await member.user.fetch();
  if (!member.guild) return;

  const { guild } = member;
  const settings = await getSettings(guild);

  // Comprobación del canal contador
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS", "USERS"].includes(doc.counter_type.toUpperCase()))) {
    if (member.user.bot) {
      settings.data.bots -= 1;
      await settings.save();
    }
    if (!client.counterUpdateQueue.includes(guild.id)) client.counterUpdateQueue.push(guild.id);
  }

  // Rastreador de invitaciones
  const inviterData = await inviteHandler.trackLeftMember(guild, member.user);

  // Mensaje de despedida
  greetingHandler.sendFarewell(member, inviterData);
};
