const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "farewell",
  description: "configuración del mensaje de despedida",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "estado <on|off>",
        description: "activar o desactivar el mensaje de despedida",
      },
      {
        trigger: "canal <#canal>",
        description: "configura un mensaje de despedida",
      },
      {
        trigger: "previsualizar",
        description: "previsualizar el mensaje de despedida configurado",
      },
      {
        trigger: "desc <texto>",
        description: "selecciona una descripción para el mensaje de despedida",
      },
      {
        trigger: "mimiatura <ON|OFF>",
        description: "habilitar/deshabilitar embed de la miniatura",
      },
      {
        trigger: "color <hexcolor>",
        description: "selecciona el color del embed",
      },
      {
        trigger: "pie de pagina <texto>",
        description: "selecciona el contenido del pie de pagina del embed",
      },
      {
        trigger: "imagen <url>",
        description: "selecciona la imagen del embed",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "activar o desactivar el mensaje de despedida",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "habilitar o deshabilitar",
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
        name: "preview",
        description: "previsualizar el mensaje de despedida configurado",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "seleccionar canal de despedida",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "nombre del canal",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "desc",
        description: "seleccionar descripción del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "contenido de la descripción",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "thumbnail",
        description: "configurar mimiatura del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "estado de la mimiatura",
            type: ApplicationCommandOptionType.String,
            required: true,
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
        name: "color",
        description: "seleccionar color del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex-code",
            description: "codigo de color hex del embed",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "footer",
        description: "seleccionar pie de pagina del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "contenido del pie de pagina",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "image",
        description: "seleccionar imagen del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "url",
            description: "url de la imagen",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    const settings = data.settings;
    let response;

    // previsualizar
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // estado
    else if (type === "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await setStatus(settings, status);
    }

    // canal
    else if (type === "channel") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // desc
    else if (type === "desc") {
      if (args.length < 2) return message.safeReply("Argumentos insuficientes Por favor, aporte contenidos válidos");
      const desc = args.slice(1).join(" ");
      response = await setDescription(settings, desc);
    }

    // mimiatura
    else if (type === "thumbnail") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await setThumbnail(settings, status);
    }

    // color
    else if (type === "color") {
      const color = args[1];
      if (!color || !isHex(color))
        return message.safeReply("Color no válido. El valor debe ser un color hexadecimal válido");
      response = await setColor(settings, color);
    }

    // pie de pagina
    else if (type === "footer") {
      if (args.length < 2) return message.safeReply("Argumentos insuficientes Por favor, aporte contenidos válidos");
      const content = args.slice(1).join(" ");
      response = await setFooter(settings, content);
    }

    // imagen
    else if (type === "image") {
      const url = args[1];
      if (!url) return message.safeReply("URL de imagen no válida. Por favor, proporcione una url válida");
      response = await setImage(settings, url);
    }

    //
    else response = "¡Uso de comando no válido!";
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    switch (sub) {
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("channel"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("content"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("status"));
        break;

      case "color":
        response = await setColor(settings, interaction.options.getString("color"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("content"));
        break;

      case "image":
        response = await setImage(settings, interaction.options.getString("url"));
        break;

      default:
        response = "Subcomando no válido";
    }

    return interaction.followUp(response);
  },
};

async function sendPreview(settings, member) {
  if (!settings.farewell?.enabled) return "Mensaje de despedida no habilitado en este servidor";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "No hay ningún canal configurado para enviar mensajes de despedida";

  const response = await buildGreeting(member, "FAREWELL", settings.farewell);
  await targetChannel.safeSend(response);

  return `Envió la vista previa de despedida a ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `¡Configuración guardada! Mensaje de despedida ${status ? "habilitado" : "deshabilitado"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "¡Uf! ¿No puedo enviar despedidas a ese canal? Necesito los permisos `Write Messages` y `Embed Links` en " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `¡Configuración guardada! Se enviará un mensaje de despedida a ${channel ? channel.toString() : "Not found"}`;
}

async function setDescription(settings, desc) {
  settings.farewell.embed.description = desc;
  await settings.save();
  return "Configuración guardada Mensaje de despedida actualizado";
}

async function setThumbnail(settings, status) {
  settings.farewell.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Configuración guardada Mensaje de despedida actualizado";
}

async function setColor(settings, color) {
  settings.farewell.embed.color = color;
  await settings.save();
  return "Configuración guardada Mensaje de despedida actualizado";
}

async function setFooter(settings, content) {
  settings.farewell.embed.footer = content;
  await settings.save();
  return "Configuración guardada Mensaje de despedida actualizado";
}

async function setImage(settings, url) {
  settings.farewell.embed.image = url;
  await settings.save();
  return "Configuración guardada Mensaje de despedida actualizado";
}
