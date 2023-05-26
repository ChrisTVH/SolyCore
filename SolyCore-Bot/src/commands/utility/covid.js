const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");
const timestampToDate = require("timestamp-to-date");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "covid",
  description: "obtener las estadísticas covid de un país",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<country>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "country",
        description: "Nombre del país para el que se quieren obtener estadísticas covid",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const country = args.join(" ");
    const response = await getCovid(country);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const country = interaction.options.getString("country");
    const response = await getCovid(country);
    await interaction.followUp(response);
  },
};

async function getCovid(country) {
  const response = await getJson(`https://disease.sh/v2/countries/${country}`);

  if (response.status === 404) return "```css\nNo se encuentra el país con el nombre indicado```";
  if (!response.success) return MESSAGES.API_ERROR;
  const { data } = response;

  const mg = timestampToDate(data?.updated, "dd.MM.yyyy at HH:mm");
  const embed = new EmbedBuilder()
    .setTitle(`Covid - ${data?.country}`)
    .setThumbnail(data?.countryInfo.flag)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addFields(
      {
        name: "Casos Totales",
        value: data?.cases.toString(),
        inline: true,
      },
      {
        name: "Casos actuales",
        value: data?.todayCases.toString(),
        inline: true,
      },
      {
        name: "Muertes Totales",
        value: data?.deaths.toString(),
        inline: true,
      },
      {
        name: "}Fallecidos totales",
        value: data?.todayDeaths.toString(),
        inline: true,
      },
      {
        name: "Recuperados",
        value: data?.recovered.toString(),
        inline: true,
      },
      {
        name: "Activo",
        value: data?.active.toString(),
        inline: true,
      },
      {
        name: "Críticos",
        value: data?.critical.toString(),
        inline: true,
      },
      {
        name: "Casos por 1 millón",
        value: data?.casesPerOneMillion.toString(),
        inline: true,
      },
      {
        name: "Muertes por 1 millón",
        value: data?.deathsPerOneMillion.toString(),
        inline: true,
      }
    )
    .setFooter({ text: `Última actualización en ${mg}` });

  return { embeds: [embed] };
}
