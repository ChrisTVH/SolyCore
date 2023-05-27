const { trackVoiceStats } = require("@handlers/stats");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  // Seguimiento de las estadísticas de voz
  trackVoiceStats(oldState, newState);

  // Erela.js
  if (client.config.MUSIC.ENABLED) {
    const guild = oldState.guild;

    // si nadie abandonó el canal en cuestión, volver.
    if (oldState.channelId !== guild.members.me.voice.channelId || newState.channel) return;

    // si no, comprueba cuántas personas hay ahora en el canal
    if (oldState.channel.members.size === 1) {
      setTimeout(() => {
        // si 1 (usted), espere 1 minuto
        if (!oldState.channel.members.size - 1) {
          const player = client.musicManager.getPlayer(guild.id);
          if (player) client.musicManager.destroyPlayer(guild.id).then(player.disconnect()); // destruir el reproductor
        }
      }, client.config.MUSIC.IDLE_TIME * 1000);
    }
  }
};
