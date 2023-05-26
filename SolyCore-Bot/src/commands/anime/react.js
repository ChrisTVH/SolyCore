const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getJson } = require("@helpers/HttpUtils");
const { EMBED_COLORS } = require("@root/config");
const NekosLife = require("nekos.life");
const neko = new NekosLife();

const choices = ["hug", "kiss", "cuddle", "feed", "pat", "poke", "slap", "smug", "tickle", "wink"];

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
      return message.safeReply(`Elección no válida: \`${category}\`.\nAvailable reactions: ${choices.join(", ")}`);
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
    if (category === "wink") {
      const response = await getJson("https://some-random-api.ml/animu/wink");
      if (!response.success) throw new Error("Error de la API");
      imageUrl = response.data.link;
    }

    // neko api
    else {
      imageUrl = (await neko[category]()).url;
    }

    return new EmbedBuilder()
      .setImage(imageUrl)
      .setColor("Aleatorio")
      .setFooter({ text: `Solicitado por ${user.tag}` });
  } catch (ex) {
    return new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription("No se ha podido recuperar el meme. Inténtalo de nuevo.")
      .setFooter({ text: `Solicitado por ${user.tag}` });
  }
};
