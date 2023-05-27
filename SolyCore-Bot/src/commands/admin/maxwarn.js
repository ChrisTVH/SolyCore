const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "maxwarn",
  description: "configurar advertencias máximas",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "limite <number>",
        description: "establecer el máximo de advertencias que puede recibir un miembro antes de emprender una acción",
      },
      {
        trigger: "acción <timeout|kick|ban>",
        description: "establecer la acción a realizar tras recibir el máximo de advertencias",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "limit",
        description: "establecer el máximo de advertencias que puede recibir un miembro antes de emprender una acción",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "número máximo de strikes",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "action",
        description: "establecer la acción a realizar tras recibir el máximo de advertencias",
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
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    if (!["limit", "action"].includes(input)) return message.safeReply("Uso de comando no válido");

    let response;
    if (input === "limit") {
      const max = parseInt(args[1]);
      if (isNaN(max) || max < 1) return message.safeReply("Las advertencias máximas deben ser un número válido mayor que 0");
      response = await setLimit(max, data.settings);
    }

    if (input === "action") {
      const action = args[1]?.toUpperCase();
      if (!action || !["TIMEOUT", "KICK", "BAN"].includes(action))
        return message.safeReply("No es una acción válida. La acción puede ser `Timeout`/`Kick`/`Ban`");
      response = await setAction(message.guild, action, data.settings);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();

    let response;
    if (sub === "limit") {
      response = await setLimit(interaction.options.getInteger("amount"), data.settings);
    }

    if (sub === "action") {
      response = await setAction(interaction.guild, interaction.options.getString("action"), data.settings);
    }

    await interaction.followUp(response);
  },
};

async function setLimit(limit, settings) {
  settings.max_warn.limit = limit;
  await settings.save();
  return `¡Configuración guardada! Las advertencias máximas se fijan en ${limit}`;
}

async function setAction(guild, action, settings) {
  if (action === "TIMEOUT") {
    if (!guild.members.me.permissions.has("ModerateMembers")) {
      return "No tengo permiso para poner tiempo de espera a los miembros";
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

  settings.max_warn.action = action;
  await settings.save();
  return `Configuración guardada. La acción Automod está ajustada a ${action}`;
}
