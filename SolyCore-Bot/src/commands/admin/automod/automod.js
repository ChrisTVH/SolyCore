const { EmbedBuilder, ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { stripIndent } = require("common-tags");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "automod",
    description: "varias configuraciones de automoderación",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "estado",
        description: "comprobar la configuración de automoderación para este servidor",
      },
      {
        trigger: "strikes <número>",
        description: "número máximo de strikes que puede recibir un miembro antes de emprender una acción",
      },
      {
        trigger: "acción <TIEMPO DE ESPERA|KICK|BAN>",
        description: "establecer la acción a realizar tras recibir el máximo de strikes",
      },
      {
        trigger: "depurar <on|off>",
        description: "activa la automoderación de los mensajes enviados por administradores y moderadores",
      },
      {
        trigger: "lista blanca",
        description: "lista de canales incluidos en la lista blanca",
      },
      {
        trigger: "añadir a la lista blanca <canal>",
        description: "añadir un canal a la lista blanca",
      },
      {
        trigger: "eliminar de la lista blanca <canal>",
        description: "eliminar un canal de la lista blanca",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "comprobar la configuración de automoderación",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "strikes",
        description: "fijar el número máximo de strikes antes de emprender una acción",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "número de strikes (por defecto 5)",
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
      {
        name: "action",
        description: "establecer la acción a realizar tras recibir el máximo de strikes",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "action",
            description: "acción a realizar",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: "TIMEOUT",
                value: "TIMEOUT",
              },
              {
                name: "KICK",
                value: "KICK",
              },
              {
                name: "BAN",
                value: "BAN",
              },
            ],
          },
        ],
      },
      {
        name: "debug",
        description: "activar/desactivar la automoderación de los mensajes enviados por los administradores y moderadores",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "estado de la configuración",
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "whitelist",
        description: "ver los canales en la lista blanca",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "whitelistadd",
        description: "añade un canal a la lista blanca",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "canal para añadir",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
      {
        name: "whitelistremove",
        description: "eliminar un canal de la lista blanca",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "canal para eliminar",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    const settings = data.settings;

    let response;
    if (input === "status") {
      response = await getStatus(settings, message.guild);
    } else if (input === "strikes") {
      const strikes = args[1];
      if (isNaN(strikes) || Number.parseInt(strikes) < 1) {
        return message.safeReply("Los strikes deben ser un número válido mayor que 0");
      }
      response = await setStrikes(settings, strikes);
    } else if (input === "action") {
      const action = args[1].toUpperCase();
      if (!action || !["TIMEOUT", "KICK", "BAN"].includes(action))
        return message.safeReply("No es una acción válida. La acción puede ser `Tiempo de espera`/`Kick`/`Ban`");
      response = await setAction(settings, message.guild, action);
    } else if (input === "debug") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await setDebug(settings, status);
    }

    // lista de blanca
    else if (input === "whitelist") {
      response = getWhitelist(message.guild, settings);
    }

    // añadir a lista blanca
    else if (input === "whitelistadd") {
      const match = message.guild.findMatchingChannels(args[1]);
      if (!match.length) return message.safeReply(`No se ha encontrado ningún canal que coincida ${args[1]}`);
      response = await whiteListAdd(settings, match[0].id);
    }

    // eliminar de la lista blanca
    else if (input === "whitelistremove") {
      const match = message.guild.findMatchingChannels(args[1]);
      if (!match.length) return message.safeReply(`No se ha encontrado ningún canal que coincida ${args[1]}`);
      response = await whiteListRemove(settings, match[0].id);
    }

    //
    else response = "Uso de comando no válido!";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    if (sub === "status") response = await getStatus(settings, interaction.guild);
    else if (sub === "strikes") response = await setStrikes(settings, interaction.options.getInteger("amount"));
    else if (sub === "action")
      response = await setAction(settings, interaction.guild, interaction.options.getString("action"));
    else if (sub === "debug") response = await setDebug(settings, interaction.options.getString("status"));
    else if (sub === "whitelist") {
      response = getWhitelist(interaction.guild, settings);
    } else if (sub === "whitelistadd") {
      const channelId = interaction.options.getChannel("channel").id;
      response = await whiteListAdd(settings, channelId);
    } else if (sub === "whitelistremove") {
      const channelId = interaction.options.getChannel("channel").id;
      response = await whiteListRemove(settings, channelId);
    }

    await interaction.followUp(response);
  },
};

async function getStatus(settings, guild) {
  const { automod } = settings;

  const logChannel = settings.modlog_channel
    ? guild.channels.cache.get(settings.modlog_channel).toString()
    : "No configurado";

  // Constructor de cadenas
  let desc = stripIndent`
    ❯ **Líneas máximas**: ${automod.max_lines || "NA"}
    ❯ **Anti-MenciónMasiva**: ${automod.anti_massmention > 0 ? "✓" : "✕"}
    ❯ **Anti-Adjunto**: ${automod.anti_attachment ? "✓" : "✕"}
    ❯ **Anti-Enlaces**: ${automod.anti_links ? "✓" : "✕"}
    ❯ **Anti-Invitaciones**: ${automod.anti_invites ? "✓" : "✕"}
    ❯ **Anti-Spam**: ${automod.anti_spam ? "✓" : "✕"}
    ❯ **Anti-MenciónFantasma**: ${automod.anti_ghostping ? "✓" : "✕"}
  `;

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Configuración de la automoderación", iconURL: guild.iconURL() })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)
    .addFields(
      {
        name: "Canal de registro",
        value: logChannel,
        inline: true,
      },
      {
        name: "Strikes máximos",
        value: automod.strikes.toString(),
        inline: true,
      },
      {
        name: "Acción",
        value: automod.action,
        inline: true,
      },
      {
        name: "Depurar",
        value: automod.debug ? "✓" : "✕",
        inline: true,
      }
    );

  return { embeds: [embed] };
}

async function setStrikes(settings, strikes) {
  settings.automod.strikes = strikes;
  await settings.save();
  return `¡Configuración guardada! Los strikes máximos se fijan en ${strikes}`;
}

async function setAction(settings, guild, action) {
  if (action === "TIMEOUT") {
    if (!guild.members.me.permissions.has("ModerateMembers")) {
      return "No tengo permiso con los miembros con el tiempo de espera";
    }
  }

  if (action === "KICK") {
    if (!guild.members.me.permissions.has("KickMembers")) {
      return "No tengo permiso para expulsar a los miembros";
    }
  }

  if (action === "BAN") {
    if (!guild.members.me.permissions.has("BanMembers")) {
      return "No tengo permiso para prohibir miembros";
    }
  }

  settings.automod.action = action;
  await settings.save();
  return `Configuración guardada. La acción de automoderación se establece en ${action}`;
}

async function setDebug(settings, input) {
  const status = input.toLowerCase() === "on" ? true : false;
  settings.automod.debug = status;
  await settings.save();
  return `¡Configuración guardada! La depuración de automoderación es ahora ${status ? "habilitado" : "deshabilitado"}`;
}

function getWhitelist(guild, settings) {
  const whitelist = settings.automod.wh_channels;
  if (!whitelist || !whitelist.length) return "No hay canales en la lista blanca";

  const channels = [];
  for (const channelId of whitelist) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;
    if (channel) channels.push(channel.toString());
  }

  return `Canales en lista blanca: ${channels.join(", ")}`;
}

async function whiteListAdd(settings, channelId) {
  if (settings.automod.wh_channels.includes(channelId)) return "El canal ya está en la lista blanca";
  settings.automod.wh_channels.push(channelId);
  await settings.save();
  return `¡Canal en la lista blanca!`;
}

async function whiteListRemove(settings, channelId) {
  if (!settings.automod.wh_channels.includes(channelId)) return "El canal no está en la lista blanca";
  settings.automod.wh_channels.splice(settings.automod.wh_channels.indexOf(channelId), 1);
  await settings.save();
  return `¡Canal eliminado de la lista blanca!`;
}
