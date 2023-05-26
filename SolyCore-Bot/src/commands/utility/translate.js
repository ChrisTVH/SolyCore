const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { translate } = require("@helpers/HttpUtils");
const { GOOGLE_TRANSLATE } = require("@src/data.json");

// Discord limita a un máximo de 25 opciones para el comando slash
// Añada los 25 códigos de idioma que desee desde aquí: https://cloud.google.com/translate/docs/languages

const choices = ["ar", "cs", "de", "en", "es", "fr", "hi", "hr", "it", "ja", "ko", "la", "nl", "pl", "ta", "te"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "translate",
  description: "traducir de una lengua a otra",
  cooldown: 20,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    aliases: ["tr"],
    usage: "<iso-code> <mensaje>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "language",
        description: "idioma de traducción",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: choices.map((choice) => ({ name: GOOGLE_TRANSLATE[choice], value: choice })),
      },
      {
        name: "text",
        description: "el texto que requiere traducción",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    let embed = new EmbedBuilder();
    const outputCode = args.shift();

    if (!GOOGLE_TRANSLATE[outputCode]) {
      embed
        .setColor(EMBED_COLORS.WARNING)
        .setDescription(
          "Código de traducción no válido. Visite [aquí](https://cloud.google.com/translate/docs/languages) para ver la lista de códigos de traducción admitidos"
        );
      return message.safeReply({ embeds: [embed] });
    }

    const input = args.join(" ");
    if (!input) message.safeReply("Proporcione un texto de traducción válido");

    const response = await getTranslation(message.author, input, outputCode);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const outputCode = interaction.options.getString("language");
    const input = interaction.options.getString("text");
    const response = await getTranslation(interaction.user, input, outputCode);
    await interaction.followUp(response);
  },
};

async function getTranslation(author, input, outputCode) {
  const data = await translate(input, outputCode);
  if (!data) return "Error al traducir su texto";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${author.username} dice`,
      iconURL: author.avatarURL(),
    })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(data.output)
    .setFooter({ text: `${data.inputLang} (${data.inputCode}) ⟶ ${data.outputLang} (${data.outputCode})` });

  return { embeds: [embed] };
}
