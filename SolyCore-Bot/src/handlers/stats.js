const { getMemberStats } = require("@schemas/MemberStats");
const { getRandomInt } = require("@helpers/Utils");

const cooldownCache = new Map();
const voiceStates = new Map();

const xpToAdd = () => getRandomInt(19) + 1;

/**
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 */
const parse = (content, member, level) => {
  return content
    .replaceAll(/\\n/g, "\n")
    .replaceAll(/{server}/g, member.guild.name)
    .replaceAll(/{count}/g, member.guild.memberCount)
    .replaceAll(/{member:id}/g, member.id)
    .replaceAll(/{member:name}/g, member.displayName)
    .replaceAll(/{member:mention}/g, member.toString())
    .replaceAll(/{member:tag}/g, member.user.tag)
    .replaceAll(/{level}/g, level);
};

module.exports = {
  /**
   * Esta función guarda las estadísticas de un nuevo mensaje
   * @param {import("discord.js").Message} message
   * @param {boolean} isCommand
   * @param {object} settings
   */
  async trackMessageStats(message, isCommand, settings) {
    const statsDb = await getMemberStats(message.guildId, message.member.id);
    if (isCommand) statsDb.commands.prefix++;
    statsDb.messages++;

    // TODO: Ignorar posibles comandos bot

    // Comprobación del enfriamiento para evitar el spam de mensajes
    const key = `${message.guildId}|${message.member.id}`;
    if (cooldownCache.has(key)) {
      const difference = (Date.now() - cooldownCache.get(key)) * 0.001;
      if (difference < message.client.config.STATS.XP_COOLDOWN) {
        return statsDb.save();
      }
      cooldownCache.delete(key);
    }

    // Actualizar la XP de los miembros en la base de datos
    statsDb.xp += xpToAdd();

    // Comprobar si el miembro ha subido de nivel
    let { xp, level } = statsDb;
    const needed = level * level * 100;

    if (xp > needed) {
      level += 1;
      xp -= needed;

      statsDb.xp = xp;
      statsDb.level = level;
      let lvlUpMessage = settings.stats.xp.message;
      lvlUpMessage = parse(lvlUpMessage, message.member, level);

      const xpChannel = settings.stats.xp.channel && message.guild.channels.cache.get(settings.stats.xp.channel);
      const lvlUpChannel = xpChannel || message.channel;

      lvlUpChannel.safeSend(lvlUpMessage);
    }
    await statsDb.save();
    cooldownCache.set(key, Date.now());
  },

  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async trackInteractionStats(interaction) {
    if (!interaction.guild) return;
    const statsDb = await getMemberStats(interaction.guildId, interaction.member.id);
    if (interaction.isChatInputCommand()) statsDb.commands.slash += 1;
    if (interaction.isUserContextMenuCommand()) statsDb.contexts.user += 1;
    if (interaction.isMessageContextMenuCommand()) statsDb.contexts.message += 1;
    await statsDb.save();
  },

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async trackVoiceStats(oldState, newState) {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && !newChannel) return;
    if (!newState.member) return;

    const member = await newState.member.fetch().catch(() => {});
    if (!member || member.user.bot) return;

    // Un miembro se a unido un canal de voz
    if (!oldChannel && newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id);
      statsDb.voice.connections += 1;
      await statsDb.save();
      voiceStates.set(member.id, Date.now());
    }

    // Un miembro dejó un canal de voz
    if (oldChannel && !newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id);
      if (voiceStates.has(member.id)) {
        const time = Date.now() - voiceStates.get(member.id);
        statsDb.voice.time += time / 1000; // add time in seconds
        await statsDb.save();
        voiceStates.delete(member.id);
      }
    }
  },
};
