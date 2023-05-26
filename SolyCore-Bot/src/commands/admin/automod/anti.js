const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "anti",
  description: "gestionar varios ajustes de moderación automática para el servidor",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "mención fantasma <on|off>",
        description: "detecta y registra menciones fantasma en tu servidor",
      },
      {
        trigger: "spam <on|off>",
        description: "activar o desactivar la detección antispam",
      },
      {
        trigger: "mención masiva <on|off> [umbral]",
        description: "activar o desactivar la detección de menciones masivas [el umbral por defecto es de 3 menciones].",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "ghostping",
        description: "detecta y registra las menciones fantasma en su servidor",
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
        name: "spam",
        description: "activar o desactivar la detección antispam",
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
        name: "massmention",
        description: "activar o desactivar la detección de menciones masivas",
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
          {
            name: "threshold",
            description: "umbral de configuración (por defecto, 3 menciones)",
            required: false,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const sub = args[0].toLowerCase();

    let response;
    if (sub == "ghostping") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await antiGhostPing(settings, status);
    }

    //
    else if (sub == "spam") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await antiSpam(settings, status);
    }

    //
    else if (sub === "massmention") {
      const status = args[1].toLowerCase();
      const threshold = args[2] || 3;
      if (!["on", "off"].includes(status)) return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await antiMassMention(settings, status, threshold);
    }

    //
    else response = "¡Uso de comando no válido!";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    if (sub == "ghostping") response = await antiGhostPing(settings, interaction.options.getString("status"));
    else if (sub == "spam") response = await antiSpam(settings, interaction.options.getString("status"));
    else if (sub === "massmention") {
      response = await antiMassMention(
        settings,
        interaction.options.getString("status"),
        interaction.options.getInteger("amount")
      );
    } else response = "¡Uso de comando no válido!";

    await interaction.followUp(response);
  },
};

async function antiGhostPing(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_ghostping = status;
  await settings.save();
  return `¡Configuración guardada! Anti-MenciónFantasma es ahora ${status ? "habilitado" : "deshabilitado"}`;
}

async function antiSpam(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_spam = status;
  await settings.save();
  return `La detección antispam es ahora ${status ? "habilitado" : "deshabilitado"}`;
}

async function antiMassMention(settings, input, threshold) {
  const status = input.toUpperCase() === "ON" ? true : false;
  if (!status) {
    settings.automod.anti_massmention = 0;
  } else {
    settings.automod.anti_massmention = threshold;
  }
  await settings.save();
  return `La detección de menciones masivas es ahora ${status ? "habilitado" : "deshabilitado"}`;
}
