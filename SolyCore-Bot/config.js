module.exports = {
    OWNER_IDS: ["410078190787362847"],
    SUPPORT_SERVER: "https://discord.gg/7ZX2yerJMG",
    PREFIX_COMMANDS: {
        ENABLED: true,
        DEFAULT_PREFIX: "!",
    },
    INTERACTIONS: {
        SLASH: true, // En caso de que quieras que se activen las interacciones
        CONTEXT: true, // En caso de que quieras que se activen los contextos
        GLOBAL: true, // ¿Deben registrarse globalmente las interacciones?
        TEST_GUILD_ID: "1038063545809645590", // ID del servidor donde se deben registrar las interacciones. [Prueba tus comandos aquí primero.]
    },
    EMBED_COLORS: {
        BOT_EMBED: "#00706e",
        TRANSPARENT: "#36393F",
        SUCCESS: "#00ff55",
        ERROR: "#901403",
        WARNING: "#f6ad06",
    },
    CACHE_SIZE: {
        GUILDS: 100,
        USERS: 10000,
        MEMBERS: 10000,
    },
    MESSAGES: {
        API_ERROR: "Una de nuestras **API** no responde, ponganse en contacto con el servidor de soporte.",
    },

    // Complementos

    AUTOMOD: {
        ENABLED: true,
        LOG_EMBED: "#6f63a0",
        DM_EMBED: "#755575",
    },

    DASHBOARD: {
        enabled: false, // activar o desactivar el panel de control
        baseURL: "http://localhost:8080", // url base
        failureURL: "http://localhost:8080", // fallo al redirigir la url
        port: "8080", // puerto para ejecutar en el bot
    },

    ECONOMY: {
        ENABLED: true,
        CURRENCY: "₪",
        DAILY_COINS: 100, // monedas a recibir por el comando daily
        MIN_BEG_AMOUNT: 100, // monedas mínimas a recibir cuando se utiliza el comando beg
        MAX_BEG_AMOUNT: 2500, // monedas máximas a recibir cuando se utiliza el comando beg
    },

    MUSIC: {
        ENABLED: true,
        IDLE_TIME: 60, // Tiempo en segundos antes de que el bot se desconecte de un canal de voz inactivo
        MAX_SEARCH_RESULTS: 5,
        DEFAULT_SOURCE: "SC", // YT = Youtube, YTM = Youtube Music, SC = SoundCloud
        // Añada aquí cualquier número de nodos lavalink
        // Consulte https://github.com/freyacodes/Lavalink para alojar su propio servidor lavalink
        LAVALINK_NODES: [
            {
                host: "narco.buses.rocks",
                port: 2269,
                password: "glasshost1984",
                id: "Lavalink Server",
                retryDelay: 5000,
                secure: false,
            },
        ],
    },

    GIVEAWAYS: {
        ENABLED: true,
        REACTION: "🎁",
        START_EMBED: "#FF468A",
        END_EMBED: "#c90076",
    },

    IMAGE: {
        ENABLED: true,
        BASE_API: "https://strangeapi.fun/api",
    },

    INVITE: {
        ENABLED: true,
    },

    MODERATION: {
        ENABLED: true,
        EMBED_COLORS: {
            TIMEOUT: "#102027",
            UNTIMEOUT: "#4B636E",
            KICK: "#FF7961",
            SOFTBAN: "#AF4448",
            BAN: "#D32F2F",
            UNBAN: "#00C853",
            VMUTE: "#102027",
            VUNMUTE: "#4B636E",
            DEAFEN: "#102027",
            UNDEAFEN: "#4B636E",
            DISCONNECT: "RANDOM",
            MOVE: "RANDOM",
        },
    },

    PRESENCE: {
        ENABLED: true, // Si el bot debe o no actualizar su estado
        STATUS: "online", // Estado del bot [online, idle, dnd, invisible].
        TYPE: "WATCHING", // Tipo de estado del bot [PLAYING | LISTENING | WATCHING | COMPETING].
        MESSAGE: "{members} miembros en {servers} servidores.", // Tu mensaje de estado del bot
    },

    STATS: {
        ENABLED: true,
        XP_COOLDOWN: 5, // Enfriamiento en segundos entre mensajes
        DEFAULT_LVL_UP_MSG: "El usuario **{member:tag}**, Acabas de pasar al **Nivel {level}**",
    },

    SUGGESTIONS: {
        ENABLED: true, // Si se activa el sistema de sugerencias
        EMOJI: {
            UP_VOTE: "⬆️",
            DOWN_VOTE: "⬇️",
        },
        DEFAULT_EMBED: "#4F545C",
        APPROVED_EMBED: "#43B581",
        DENIED_EMBED: "#F04747",
    },

    TICKET: {
        ENABLED: true, // Si se activa el sistema de tickets
        CREATE_EMBED: "#6AA84F",
        CLOSE_EMBED: "#F44336",
    },
};
