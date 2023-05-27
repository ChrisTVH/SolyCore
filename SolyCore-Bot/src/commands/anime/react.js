const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getJson } = require("@helpers/HttpUtils");
const { EMBED_COLORS } = require("@root/config");
const NekosLife = require("nekos.life");
const neko = new NekosLife();

const choices = ["hug", "kiss", "cuddle", "feed", "pat", "poke", "slap", "smug", "tickle", "waifu"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "react",
  description: "Reacciones de anime",
  enabled: true,
  category: "ANIME",
  cooldown: 5,
  command: {
    enabled: true,
    minArgsCount: 1,
    usage: "[reacción]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "category",
        description: "tipo de reacción",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices.map((ch) => ({ name: ch, value: ch })),
      },
    ],
  },

  async messageRun(message, args) {
    const category = args[0].toLowerCase();
    if (!choices.includes(category)) {
      return message.safeReply(`Elección no válida: \`${category}\`.\nReacciones disponibles: ${choices.join(", ")}`);
    }

    const embed = await genReaction(category, message.author);
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("category");
    const embed = await genReaction(choice, interaction.user);
    await interaction.followUp({ embeds: [embed] });
  },
};

const genReaction = async (category, user) => {
  try {
    let imageUrl;

    // alguna api aleatoria
    if (category === "waifu") {
      const response = await getJson("https://nekos.life/api/v2/img/waifu");
      if (!response.success) throw new Error("Error de la API");
      imageUrl = response.data.link;
    }

    // neko api
    else {
      imageUrl = (await neko[category]()).url;
    }

    return new EmbedBuilder()
      .setImage(imageUrl)
      .setColor("Random")
      .setFooter({ text: `Solicitado por ${user.tag}` });
  } catch (ex) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription("No se ha podido recuperar la reacción. Inténtalo de nuevo.")
      .setFooter({ text: `Solicitado por ${user.tag}` });
  }
};
