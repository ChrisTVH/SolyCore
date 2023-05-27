const { counterHandler, inviteHandler, presenceHandler } = require("@src/handlers");
const { cacheReactionRoles } = require("@schemas/ReactionRoles");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = async (client) => {
  client.logger.success(`Conectado como: ${client.user.tag}! (${client.user.id})`);

  // Inicializar Music Manager
  if (client.config.MUSIC.ENABLED) {
    client.musicManager.connect(client.user.id);
    client.logger.success("Gestor de música inicializado");
  }

  // Inicializar Giveaways Manager
  if (client.config.GIVEAWAYS.ENABLED) {
    client.logger.log("Inicializando el gestor de sorteos...");
    client.giveawaysManager._init().then((_) => client.logger.success("Gestor de sorteos inicializado"));
  }

  // Actualizar la presencia del bot
  if (client.config.PRESENCE.ENABLED) {
    presenceHandler(client);
  }

  // Registro de Interacciones
  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    if (client.config.INTERACTIONS.GLOBAL) await client.registerInteractions();
    else await client.registerInteractions(client.config.INTERACTIONS.TEST_GUILD_ID);
  }

  // Cargar funciones de reacción en la caché
  await cacheReactionRoles(client);

  for (const guild of client.guilds.cache.values()) {
    const settings = await getSettings(guild);

    // inicializar contador
    if (settings.counters.length > 0) {
      await counterHandler.init(guild, settings);
    }

    // caché de invitaciones
    if (settings.invite.tracking) {
      inviteHandler.cacheGuildInvites(guild);
    }
  }

  setInterval(() => counterHandler.updateCounterChannels(client), 10 * 60 * 1000);
};
