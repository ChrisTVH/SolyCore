const CommandCategory = require("@structures/CommandCategory");
const permissions = require("./permissions");
const config = require("@root/config");
const { log, warn, error } = require("./Logger");
const { ApplicationCommandType } = require("discord.js");

module.exports = class Validator {
  static validateConfiguration() {
    log("Validación del archivo de configuración y las variables de entorno");

    // Bot Token
    if (!process.env.BOT_TOKEN) {
      error("env: BOT_TOKEN no puede estar vacío");
      process.exit(1);
    }

    // Validar la configuración de la base de datos
    if (!process.env.MONGO_CONNECTION) {
      error("env: MONGO_CONNECTION no puede estar vacío");
      process.exit(1);
    }

    // Validar la configuración del panel de control
    if (config.DASHBOARD.enabled) {
      if (!process.env.BOT_SECRET) {
        error("env: BOT_SECRET no puede estar vacío");
        process.exit(1);
      }
      if (!process.env.SESSION_PASSWORD) {
        error("env: SESSION_PASSWORD no puede estar vacío");
        process.exit(1);
      }
      if (!config.DASHBOARD.baseURL || !config.DASHBOARD.failureURL || !config.DASHBOARD.port) {
        error("config.js: Los detalles del DASHBOARD no pueden estar vacíos");
        process.exit(1);
      }
    }

    // Tamaño de la caché
    if (isNaN(config.CACHE_SIZE.GUILDS) || isNaN(config.CACHE_SIZE.USERS) || isNaN(config.CACHE_SIZE.MEMBERS)) {
      error("config.js: CACHE_SIZE debe ser un entero positivo");
      process.exit(1);
    }

    // Música
    if (config.MUSIC.ENABLED) {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        warn("env: Falta SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET. Los enlaces de música de Spotify no funcionan");
      }
      if (config.MUSIC.LAVALINK_NODES.length == 0) {
        warn("config.js: Debe haber al menos un nodo para Lavalink");
      }
      if (!["YT", "YTM", "SC"].includes(config.MUSIC.DEFAULT_SOURCE)) {
        warn("config.js: MUSIC.DEFAULT_SOURCE debe ser YT, YTM o SC");
      }
    }

    // Advertencias
    if (config.OWNER_IDS.length === 0) warn("config.js: OWNER_IDS están vacíos");
    if (!config.SUPPORT_SERVER) warn("config.js: SUPPORT_SERVER no se proporciona");
    if (!process.env.WEATHERSTACK_KEY) warn("env: WEATHERSTACK_KEY falta. El comando meteorológico no funciona");
    if (!process.env.STRANGE_API_KEY) warn("env: STRANGE_API_KEY falta. Los comandos de imagen no funcionan");
  }

  /**
   * @param {import('@structures/Command')} cmd
   */
  static validateCommand(cmd) {
    if (typeof cmd !== "object") {
      throw new TypeError("Los datos del comando deben ser un Objeto.");
    }
    if (typeof cmd.name !== "string" || cmd.name !== cmd.name.toLowerCase()) {
      throw new Error("El nombre del comando debe ser una cadena en minúsculas.");
    }
    if (typeof cmd.description !== "string") {
      throw new TypeError("La descripción del comando debe ser una cadena.");
    }
    if (cmd.cooldown && typeof cmd.cooldown !== "number") {
      throw new TypeError("El enfriamiento del comando debe ser un número");
    }
    if (cmd.category) {
      if (!Object.prototype.hasOwnProperty.call(CommandCategory, cmd.category)) {
        throw new Error(`No es una categoría válida ${cmd.category}`);
      }
    }
    if (cmd.userPermissions) {
      if (!Array.isArray(cmd.userPermissions)) {
        throw new TypeError("El comando userPermissions debe ser un array de cadenas de claves de permisos.");
      }
      for (const perm of cmd.userPermissions) {
        if (!permissions[perm]) throw new RangeError(`Comando no válido userPermission: ${perm}`);
      }
    }
    if (cmd.botPermissions) {
      if (!Array.isArray(cmd.botPermissions)) {
        throw new TypeError("El comando botPermissions debe ser un array de cadenas de claves de permisos.");
      }
      for (const perm of cmd.botPermissions) {
        if (!permissions[perm]) throw new RangeError(`Comando inválido botPermission: ${perm}`);
      }
    }
    if (cmd.validations) {
      if (!Array.isArray(cmd.validations)) {
        throw new TypeError("Las validaciones de comandos deben ser una Array de objetos de validación.");
      }
      for (const validation of cmd.validations) {
        if (typeof validation !== "object") {
          throw new TypeError("Las validaciones de comandos deben ser un objeto.");
        }
        if (typeof validation.callback !== "function") {
          throw new TypeError("El callback de validación del comando debe ser una función.");
        }
        if (typeof validation.message !== "string") {
          throw new TypeError("El mensaje de validación del comando debe ser una cadena.");
        }
      }
    }

    // Validar detalles del comando
    if (cmd.command) {
      if (typeof cmd.command !== "object") {
        throw new TypeError("Command.command debe ser un objeto");
      }
      if (Object.prototype.hasOwnProperty.call(cmd.command, "enabled") && typeof cmd.command.enabled !== "boolean") {
        throw new TypeError("Command.command enabled debe ser un valor booleano");
      }
      if (
        cmd.command.aliases &&
        (!Array.isArray(cmd.command.aliases) ||
          cmd.command.aliases.some((ali) => typeof ali !== "string" || ali !== ali.toLowerCase()))
      ) {
        throw new TypeError("Command.command aliases debe ser un Array de cadenas en minúsculas.");
      }
      if (cmd.command.usage && typeof cmd.command.usage !== "string") {
        throw new TypeError("El uso de command.command debe ser una cadena");
      }
      if (cmd.command.minArgsCount && typeof cmd.command.minArgsCount !== "number") {
        throw new TypeError("Command.command minArgsCount debe ser un número");
      }
      if (cmd.command.subcommands && !Array.isArray(cmd.command.subcommands)) {
        throw new TypeError("Los subcomandos de command.command deben ser una Array");
      }
      if (cmd.command.subcommands) {
        for (const sub of cmd.command.subcommands) {
          if (typeof sub !== "object") {
            throw new TypeError("Los subcomandos de command.command deben ser una Array de objetos");
          }
          if (typeof sub.trigger !== "string") {
            throw new TypeError("Command.command el subcomando trigger debe ser una cadena");
          }
          if (typeof sub.description !== "string") {
            throw new TypeError("La descripción del subcomando Command.command debe ser una cadena");
          }
        }
      }
      if (cmd.command.enabled && typeof cmd.messageRun !== "function") {
        throw new TypeError("Falta la función 'messageRun'");
      }
    }

    // Validar los detalles del comando Slash
    if (cmd.slashCommand) {
      if (typeof cmd.slashCommand !== "object") {
        throw new TypeError("Command.slashCommand debe ser un objeto");
      }
      if (
        Object.prototype.hasOwnProperty.call(cmd.slashCommand, "enabled") &&
        typeof cmd.slashCommand.enabled !== "boolean"
      ) {
        throw new TypeError("Command.slashCommand enabled debe ser un valor booleano");
      }
      if (
        Object.prototype.hasOwnProperty.call(cmd.slashCommand, "ephemeral") &&
        typeof cmd.slashCommand.ephemeral !== "boolean"
      ) {
        throw new TypeError("Command.slashCommand ephemeral debe ser un valor booleano");
      }
      if (cmd.slashCommand.options && !Array.isArray(cmd.slashCommand.options)) {
        throw new TypeError("Las opciones de Command.slashCommand deben ser un array");
      }
      if (cmd.slashCommand.enabled && typeof cmd.interactionRun !== "function") {
        throw new TypeError("Falta la función 'interactionRun'");
      }
    }
  }

  /**
   * @param {import('@structures/BaseContext')} context
   */
  static validateContext(context) {
    if (typeof context !== "object") {
      throw new TypeError("El contexto debe ser un objeto");
    }
    if (typeof context.name !== "string" || context.name !== context.name.toLowerCase()) {
      throw new Error("El nombre del contexto debe ser una cadena en minúsculas.");
    }
    if (typeof context.description !== "string") {
      throw new TypeError("La descripción del contexto debe ser una cadena.");
    }
    if (context.type !== ApplicationCommandType.User && context.type !== ApplicationCommandType.Message) {
      throw new TypeError("El tipo de contexto debe ser Usuario/Mensaje.");
    }
    if (Object.prototype.hasOwnProperty.call(context, "enabled") && typeof context.enabled !== "boolean") {
      throw new TypeError("Context enabled debe ser un valor booleano");
    }
    if (Object.prototype.hasOwnProperty.call(context, "ephemeral") && typeof context.ephemeral !== "boolean") {
      throw new TypeError("Context enabled debe ser un valor booleano");
    }
    if (
      Object.prototype.hasOwnProperty.call(context, "defaultPermission") &&
      typeof context.defaultPermission !== "boolean"
    ) {
      throw new TypeError("Context defaultPermission debe ser un valor booleano");
    }
    if (Object.prototype.hasOwnProperty.call(context, "cooldown") && typeof context.cooldown !== "number") {
      throw new TypeError("El enfriamiento del contexto debe ser un número");
    }
    if (context.userPermissions) {
      if (!Array.isArray(context.userPermissions)) {
        throw new TypeError("Context userPermissions debe ser una Array de cadenas de claves de permisos.");
      }
      for (const perm of context.userPermissions) {
        if (!permissions[perm]) throw new RangeError(`Comando no válido userPermission: ${perm}`);
      }
    }
  }
};
