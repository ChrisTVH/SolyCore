const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  WebhookClient,
  ApplicationCommandType,
} = require("discord.js");
const path = require("path");
const { table } = require("table");
const Logger = require("../helpers/Logger");
const { recursiveReadDirSync } = require("../helpers/Utils");
const { validateCommand, validateContext } = require("../helpers/Validator");
const { schemas } = require("@src/database/mongoose");
const CommandCategory = require("./CommandCategory");
const lavaclient = require("../handlers/lavaclient");
const giveawaysHandler = require("../handlers/giveaway");
const { DiscordTogether } = require("discord-together");

module.exports = class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.User, Partials.Message, Partials.Reaction],
      allowedMentions: {
        repliedUser: false,
      },
      restRequestTimeout: 20000,
    });

    this.wait = require("util").promisify(setTimeout); // await client.wait(1000) - Espera 1 segundo
    this.config = require("@root/config"); // cargar el archivo de configuración

    /**
     * @type {import('@structures/Command')[]}
     */
    this.commands = []; // store actual command
    this.commandIndex = new Collection(); // almacenar (alias, arrayIndex) par

    /**
     * @type {Collection<string, import('@structures/Command')>}
     */
    this.slashCommands = new Collection(); // almacenar comandos de slash

    /**
     * @type {Collection<string, import('@structures/BaseContext')>}
     */
    this.contextMenus = new Collection(); // almacenar contextMenus
    this.counterUpdateQueue = []; // almacenar guildId's que necesitan actualización del contador

    // inicializar el webhook para enviar los detalles de unión/abandono del guild
    this.joinLeaveWebhook = process.env.JOIN_LEAVE_LOGS
      ? new WebhookClient({ url: process.env.JOIN_LEAVE_LOGS })
      : undefined;

    // Reproductor de música
    if (this.config.MUSIC.ENABLED) this.musicManager = lavaclient(this);

    // Sorteos
    if (this.config.GIVEAWAYS.ENABLED) this.giveawaysManager = giveawaysHandler(this);

    // Logger
    this.logger = Logger;

    // Base de datos
    this.database = schemas;

    // Discord Together
    this.discordTogether = new DiscordTogether(this);
  }

  /**
   * Cargar todos los eventos del directorio especificado
   * @param {string} directory directorio que contiene los archivos de eventos
   */
  loadEvents(directory) {
    this.logger.log(`Cargando eventos...`);
    let success = 0;
    let failed = 0;
    const clientEvents = [];

    recursiveReadDirSync(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const eventName = path.basename(file, ".js");
        const event = require(filePath);

        this.on(eventName, event.bind(null, this));
        clientEvents.push([file, "✓"]);

        delete require.cache[require.resolve(filePath)];
        success += 1;
      } catch (ex) {
        failed += 1;
        this.logger.error(`loadEvent - ${file}`, ex);
      }
    });

    console.log(
      table(clientEvents, {
        header: {
          alignment: "center",
          content: "Eventos de clientes",
        },
        singleLine: true,
        columns: [{ width: 25 }, { width: 5, alignment: "center" }],
      })
    );

    this.logger.log(`Eventos cargados ${success + failed}. Éxito (${success}) Fallo (${failed})`);
  }

  /**
   * Buscar comando que coincida con la invocación
   * @param {string} invoke
   * @returns {import('@structures/Command')|undefined}
   */
  getCommand(invoke) {
    const index = this.commandIndex.get(invoke.toLowerCase());
    return index !== undefined ? this.commands[index] : undefined;
  }

  /**
   * Registrar archivo de comandos en el cliente
   * @param {import("@structures/Command")} cmd
   */
  loadCommand(cmd) {
    // Comprobar si la categoría está desactivada
    if (cmd.category && CommandCategory[cmd.category]?.enabled === false) {
      this.logger.debug(`Omisión de comandos ${cmd.name}. La categoría ${cmd.category} está deshabilitada.`);
      return;
    }
    // Prefijo del comando
    if (cmd.command?.enabled) {
      const index = this.commands.length;
      if (this.commandIndex.has(cmd.name)) {
        throw new Error(`El comando ${cmd.name} ya esta registrado`);
      }
      if (Array.isArray(cmd.command.aliases)) {
        cmd.command.aliases.forEach((alias) => {
          if (this.commandIndex.has(alias)) throw new Error(`El alias ${alias} ya esta registrado.`);
          this.commandIndex.set(alias.toLowerCase(), index);
        });
      }
      this.commandIndex.set(cmd.name.toLowerCase(), index);
      this.commands.push(cmd);
    } else {
      this.logger.debug(`Omitiendo el comando ${cmd.name}. Deshabilitado!`);
    }

    // Slash Command
    if (cmd.slashCommand?.enabled) {
      if (this.slashCommands.has(cmd.name)) throw new Error(`El comando de slash ${cmd.name} ya esta registrado.`);
      this.slashCommands.set(cmd.name, cmd);
    } else {
      this.logger.debug(`Saltando el comando de slash ${cmd.name}. está deshabilitado!`);
    }
  }

  /**
   * Cargar todos los comandos del directorio especificado
   * @param {string} directory
   */
  loadCommands(directory) {
    this.logger.log(`Cargando comandos...`);
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const cmd = require(file);
        if (typeof cmd !== "object") continue;
        validateCommand(cmd);
        this.loadCommand(cmd);
      } catch (ex) {
        this.logger.error(`Fallo al cargar ${file} Razón: ${ex.message}`);
      }
    }

    this.logger.success(`Comandos cargados ${this.commands.length}`);
    this.logger.success(`Comandos de slash cargados ${this.slashCommands.size}`);
      if (this.slashCommands.size > 100) throw new Error("Se puede activar un máximo de 100 comandos de slash");
  }

  /**
   * Cargar todos los contextos del directorio especificado
   * @param {string} directory
   */
  loadContexts(directory) {
    this.logger.log(`Cargando contextos...`);
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const ctx = require(file);
        if (typeof ctx !== "object") continue;
        validateContext(ctx);
        if (!ctx.enabled) return this.logger.debug(`Omitiendo contextos ${ctx.name}. deshabilitados!`);
        if (this.contextMenus.has(ctx.name)) throw new Error(`Ya existe un contexto con ese nombre`);
        this.contextMenus.set(ctx.name, ctx);
      } catch (ex) {
        this.logger.error(`Fallo al cargar ${file} Razón: ${ex.message}`);
      }
    }

    const userContexts = this.contextMenus.filter((ctx) => ctx.type === "USER").size;
    const messageContexts = this.contextMenus.filter((ctx) => ctx.type === "MESSAGE").size;

    if (userContexts > 3) throw new Error("Se puede habilitar un máximo de 3 contextos de USUARIO");
    if (messageContexts > 3) throw new Error("Se puede habilitar un máximo de 3 contextos de MENSAJE");
    
    this.logger.success(`Cargado contextos de USUARIO ${userContexts}`);
    this.logger.success(`Cargado contextos de MENSAJE ${messageContexts}`);
  }

  /**
   * Registrar el comando slash al inicio
   * @param {string} [guildId]
   */
  async registerInteractions(guildId) {
    const toRegister = [];

    // filtrar comandos de slash
    if (this.config.INTERACTIONS.SLASH) {
      this.slashCommands
        .map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
        }))
        .forEach((s) => toRegister.push(s));
    }

    // filtrar contextos
    if (this.config.INTERACTIONS.CONTEXT) {
      this.contextMenus
        .map((ctx) => ({
          name: ctx.name,
          type: ctx.type,
        }))
        .forEach((c) => toRegister.push(c));
    }

    // Registro Global
    if (!guildId) {
      await this.application.commands.set(toRegister);
    }

    // Registro para un guild especifico
    else if (guildId && typeof guildId === "string") {
      const guild = this.guilds.cache.get(guildId);
      if (!guild) {
          this.logger.error(`Error al registrar interacciones en el servidor ${guildId}`, new Error("No hay ningún servidor"));
        return;
      }
      await guild.commands.set(toRegister);
    }

    // Throw an error
    else {
      throw new Error("¿Proporcionaste un GuildId válido para registrarte?");
    }

    this.logger.success("Interacciones registradas con éxito");
  }

  /**
   * @param {string} search
   * @param {Boolean} exact
   */
  async resolveUsers(search, exact = false) {
    if (!search || typeof search !== "string") return [];
    const users = [];

    // comprueba si se pasa userId
    const patternMatch = search.match(/(\d{17,20})/);
    if (patternMatch) {
      const id = patternMatch[1];
      const fetched = await this.users.fetch(id, { cache: true }).catch(() => {}); // check if mentions contains the ID
      if (fetched) {
        users.push(fetched);
        return users;
      }
    }

    // comprobar si la etiqueta exacta coincide en la caché
    const matchingTags = this.users.cache.filter((user) => user.tag === search);
    if (exact && matchingTags.size === 1) users.push(matchingTags.first());
    else matchingTags.forEach((match) => users.push(match));

    // comprobar si el nombre de usuario coincide
    if (!exact) {
      this.users.cache
        .filter(
          (x) =>
            x.username === search ||
            x.username.toLowerCase().includes(search.toLowerCase()) ||
            x.tag.toLowerCase().includes(search.toLowerCase())
        )
        .forEach((user) => users.push(user));
    }

    return users;
  }

  /**
   * Consigue la invitación del bot
   */
  getInvite() {
    return this.generateInvite({
      scopes: ["bot", "applications.commands"],
      permissions: [
        "AddReactions",
        "AttachFiles",
        "BanMembers",
        "ChangeNickname",
        "Connect",
        "DeafenMembers",
        "EmbedLinks",
        "KickMembers",
        "ManageChannels",
        "ManageGuild",
        "ManageMessages",
        "ManageNicknames",
        "ManageRoles",
        "ModerateMembers",
        "MoveMembers",
        "MuteMembers",
        "PrioritySpeaker",
        "ReadMessageHistory",
        "SendMessages",
        "SendMessagesInThreads",
        "Speak",
        "ViewChannel",
      ],
    });
  }
};
