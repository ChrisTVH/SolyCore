const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getBuffer } = require("@helpers/HttpUtils");
const { getImageFromMessage } = require("@helpers/BotUtils");
const { EMBED_COLORS, IMAGE } = require("@root/config.js");

const availableFilters = [
  "blur",
  "brighten",
  "burn",
  "darken",
  "distort",
  "greyscale",
  "invert",
  "pixelate",
  "sepia",
  "sharpen",
  "threshold",
];

const additionalParams = {
  brighten: {
    params: [{ name: "amount", value: "100" }],
  },
  darken: {
    params: [{ name: "amount", value: "100" }],
  },
  distort: {
    params: [{ name: "level", value: "10" }],
  },
  pixelate: {
    params: [{ name: "pixels", value: "10" }],
  },
  sharpen: {
    params: [{ name: "level", value: "5" }],
  },
  threshold: {
    params: [{ name: "amount", value: "100" }],
  },
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "filter",
  description: "añadir filtro a la imagen proporcionada",
  cooldown: 5,
  category: "IMAGE",
  botPermissions: ["EmbedLinks", "AttachFiles"],
  command: {
    enabled: true,
    aliases: availableFilters,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "name",
        description: "el tipo de filtro",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: availableFilters.map((filter) => ({ name: filter, value: filter })),
      },
      {
        name: "user",
        description: "el usuario a cuyo avatar debe aplicarse el filtro",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "link",
        description: "el enlace de la imagen a la que debe aplicarse el filtro",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args, data) {
    const image = await getImageFromMessage(message, args);

    // utilizar invoke como punto final
    const url = getFilter(data.invoke.toLowerCase(), image);
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
      },
    });

    if (!response.success) return message.safeReply("Error al generar la imagen");

    const attachment = new AttachmentBuilder(response.buffer, { name: "attachment.png" });
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage("attachment://attachment.png")
      .setFooter({ text: `Solicitado por: ${message.author.tag}` });

    await message.safeReply({ embeds: [embed], files: [attachment] });
  },

  async interactionRun(interaction) {
    const author = interaction.user;
    const user = interaction.options.getUser("user");
    const imageLink = interaction.options.getString("link");
    const filter = interaction.options.getString("name");

    let image;
    if (user) image = user.displayAvatarURL({ size: 256, extension: "png" });
    if (!image && imageLink) image = imageLink;
    if (!image) image = author.displayAvatarURL({ size: 256, extension: "png" });

    const url = getFilter(filter, image);
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
      },
    });

    if (!response.success) return interaction.followUp("Error al generar la imagen");

    const attachment = new AttachmentBuilder(response.buffer, { name: "attachment.png" });
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage("attachment://attachment.png")
      .setFooter({ text: `Solicitado por: ${author.tag}` });

    await interaction.followUp({ embeds: [embed], files: [attachment] });
  },
};

function getFilter(filter, image) {
  const endpoint = new URL(`${IMAGE.BASE_API}/filters/${filter}`);
  endpoint.searchParams.append("image", image);

  // añada parámetros adicionales si los hay
  if (additionalParams[filter]) {
    additionalParams[filter].params.forEach((param) => {
      endpoint.searchParams.append(param.name, param.value);
    });
  }

  return endpoint.href;
}
