const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "welcome",
  description: "configurar mensaje de bienvenida",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "estado <on|off>",
        description: "activar o desactivar el mensaje de bienvenida",
      },
      {
        trigger: "canal <#canal>",
        description: "configurar el mensaje de bienvenida",
      },
      {
        trigger: "preview",
        description: "previsualizar el mensaje de bienvenida configurado",
      },
      {
        trigger: "desc <texto>",
        description: "establecer la descripción del embed",
      },
      {
        trigger: "miniatura <ON|OFF>",
        description: "habilitar/deshabilitar incrustar miniatura",
      },
      {
        trigger: "color <hexcolor>",
        description: "seleccionar un color para el embed",
      },
      {
        trigger: "pie de pagina <texto>",
        description: "Establecer el contenido del pie de página del embed",
      },
      {
        trigger: "imagen <url>",
        description: "seleccionar la imagen del embed",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "activar o desactivar el mensaje de bienvenida",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "habilitado o deshabilitado",
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
        description: "previsualizar el mensaje de bienvenida configurado",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "establecer canal de bienvenida",
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
        description: "seleccionar una descripción para el embed",
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
        description: "configura la mimiatura del embed",
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
        description: "selecciona el color del embed",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex-code",
            description: "codigo de color hex",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "footer",
        description: "seleccionar el pie de pagina del embed",
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
        description: "seleccionar la imagen del embed",
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

    // vista prevía
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
  if (!settings.welcome?.enabled) return "Mensaje de bienvenida no habilitado en este servidor";

  const targetChannel = member.guild.channels.cache.get(settings.welcome.channel);
  if (!targetChannel) return "Ningún canal está configurado para enviar mensajes de bienvenida";

  const response = await buildGreeting(member, "WELCOME", settings.welcome);
  await targetChannel.safeSend(response);

  return `Enviada vista previa de bienvenida a ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.welcome.enabled = enabled;
  await settings.save();
  return `¡Configuración guardada! Mensaje de bienvenida ${enabled ? "habilitado" : "deshabilitado"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "¡Uf! ¿No puedo enviar saludos a ese canal? Necesito los permisos `Write Messages` y `Embed Links` en " +
      channel.toString()
    );
  }
  settings.welcome.channel = channel.id;
  await settings.save();
  return `¡Configuración guardada! Se enviará un mensaje de bienvenida a ${channel ? channel.toString() : "Not found"}`;
}

async function setDescription(settings, desc) {
  settings.welcome.embed.description = desc;
  await settings.save();
  return "Configuración guardada Mensaje de bienvenida actualizado";
}

async function setThumbnail(settings, status) {
  settings.welcome.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Configuración guardada Mensaje de bienvenida actualizado";
}

async function setColor(settings, color) {
  settings.welcome.embed.color = color;
  await settings.save();
  return "Configuración guardada Mensaje de bienvenida actualizado";
}

async function setFooter(settings, content) {
  settings.welcome.embed.footer = content;
  await settings.save();
  return "Configuración guardada Mensaje de bienvenida actualizado";
}

async function setImage(settings, url) {
  settings.welcome.embed.image = url;
  await settings.save();
  return "Configuración guardada Mensaje de bienvenida actualizado";
}
