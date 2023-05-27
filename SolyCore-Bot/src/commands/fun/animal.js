const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");

const animals = ["cat", "dog", "panda", "fox", "red_panda", "koala", "bird", "raccoon", "kangaroo"];
const BASE_URL = "https://some-random-api.ml/animal";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "animal",
  description: "muestra una imagen aleatoria de un animal",
  cooldown: 5,
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<tipo>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "name",
        description: "tipo de animal",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: animals.map((animal) => ({ name: animal, value: animal })),
      },
    ],
  },

  async messageRun(message, args) {
    const choice = args[0];
    if (!animals.includes(choice)) {
      return message.safeReply(`Animal no válido seleccionado. Animales disponibles:\n${animals.join(", ")}`);
    }
    const response = await getAnimal(message.author, choice);
    return message.safeReply(response);
  },

  async interactionRun(interaction) {
    const choice = interaction.options.getString("name");
    const response = await getAnimal(interaction.user, choice);
    await interaction.followUp(response);
  },
};

async function getAnimal(user, choice) {
  const response = await getJson(`${BASE_URL}/${choice}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const imageUrl = response.data?.image;
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.TRANSPARENT)
    .setImage(imageUrl)
    .setFooter({ text: `Solicitado por ${user.tag}` });

  return { embeds: [embed] };
}
