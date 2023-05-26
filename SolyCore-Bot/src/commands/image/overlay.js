const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getBuffer } = require("@helpers/HttpUtils");
const { getImageFromMessage } = require("@helpers/BotUtils");
const { EMBED_COLORS, IMAGE } = require("@root/config.js");

const availableOverlays = [
  "approved",
  "brazzers",
  "gay",
  "halloween",
  "rejected",
  "thuglife",
  "to-be-continued",
  "wasted",
];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "overlay",
  description: "añadir superposición sobre la imagen proporcionada",
  cooldown: 5,
  category: "IMAGE",
  botPermissions: ["EmbedLinks", "AttachFiles"],
  command: {
    enabled: true,
    aliases: availableOverlays,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "name",
        description: "el tipo de superposición",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: availableOverlays.map((overlay) => ({ name: overlay, value: overlay })),
      },
      {
        name: "user",
        description: "el usuario a cuyo avatar debe aplicarse la superposición",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: "link",
        description: "el enlace de la imagen a la que debe aplicarse la superposición",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args, data) {
    const image = await getImageFromMessage(message, args);

    // utilizar invoke como punto final
    const url = getOverlay(data.invoke.toLowerCase(), image);
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

    const url = getOverlay(filter, image);
    const response = await getBuffer(url, {
      headers: {
        Authorization: `Bearer ${process.env.STRANGE_API_KEY}`,
      },
    });

    if (!response.success) return interaction.followUp("Error al generar superposición de imágenes");

    const attachment = new AttachmentBuilder(response.buffer, { name: "attachment.png" });
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage("attachment://attachment.png")
      .setFooter({ text: `Solicitado por: ${author.tag}` });

    await interaction.followUp({ embeds: [embed], files: [attachment] });
  },
};

function getOverlay(filter, image) {
  const endpoint = new URL(`${IMAGE.BASE_API}/overlays/${filter}`);
  endpoint.searchParams.append("image", image);
  return endpoint.href;
}
