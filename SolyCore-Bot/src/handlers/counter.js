const { getSettings } = require("@schemas/Guild");

/**
 * Actualiza el canal contador para todos los guildId presentes en la cola de actualización.
 * @param {import('@src/structures').BotClient} client
 */
async function updateCounterChannels(client) {
  client.counterUpdateQueue.forEach(async (guildId) => {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    try {
      const settings = await getSettings(guild);

      const all = guild.memberCount;
      const bots = settings.data.bots;
      const members = all - bots;

      for (const config of settings.counters) {
        const chId = config.channel_id;
        const vc = guild.channels.cache.get(chId);
        if (!vc) continue;

        let channelName;
        if (config.counter_type.toUpperCase() === "USERS") channelName = `${config.name} : ${all}`;
        if (config.counter_type.toUpperCase() === "MEMBERS") channelName = `${config.name} : ${members}`;
        if (config.counter_type.toUpperCase() === "BOTS") channelName = `${config.name} : ${bots}`;

        if (vc.manageable) vc.setName(channelName).catch((err) => vc.client.logger.log("Set Name error: ", err));
      }
    } catch (ex) {
      client.logger.error(`Error updating counter channels for guildId: ${guildId}`, ex);
    } finally {
      // eliminar guildId de la caché
      const i = client.counterUpdateQueue.indexOf(guild.id);
      if (i > -1) client.counterUpdateQueue.splice(i, 1);
    }
  });
}

/**
 * Inicializar contadores de gremio al inicio
 * @param {import("discord.js").Guild} guild
 * @param {Object} settings
 */
async function init(guild, settings) {
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS"].includes(doc.counter_type.toUpperCase()))) {
    const stats = await guild.fetchMemberStats();
    settings.data.bots = stats[1]; // actualizar el recuento de bots en la base de datos
    await settings.save();
  }

  // calendario de actualización
  if (!guild.client.counterUpdateQueue.includes(guild.id)) guild.client.counterUpdateQueue.push(guild.id);
  return true;
}

module.exports = { init, updateCounterChannels };
