const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@helpers/HttpUtils");

const API_KEY = process.env.WEATHERSTACK_KEY;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "weather",
  description: "obtener información meteorológica",
  cooldown: 5,
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<lugar>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "place",
        description: "nombre del país/ciudad para obtener información meteorológica de",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const place = args.join(" ");
    const response = await weather(place);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const place = interaction.options.getString("place");
    const response = await weather(place);
    await interaction.followUp(response);
  },
};

async function weather(place) {
  const response = await getJson(`http://api.weatherstack.com/current?access_key=${API_KEY}&query=${place}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  if (!json.request) return `No se ha encontrado ninguna ciudad que coincida \`${place}\``;

  const embed = new EmbedBuilder()
    .setTitle("Clima")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.current?.weather_icons[0])
    .addFields(
      { name: "Ciudad", value: json.location?.name || "NA", inline: true },
      { name: "Región", value: json.location?.region || "NA", inline: true },
      { name: "País", value: json.location?.country || "NA", inline: true },
      { name: "Condiciones meteorológicas", value: json.current?.weather_descriptions[0] || "NA", inline: true },
      { name: "Fecha", value: json.location?.localtime.slice(0, 10) || "NA", inline: true },
      { name: "Tiempo", value: json.location?.localtime.slice(11, 16) || "NA", inline: true },
      { name: "Temperatura", value: `${json.current?.temperature}°C`, inline: true },
      { name: "Nubosidad", value: `${json.current?.cloudcover}%`, inline: true },
      { name: "Velocidad del viento", value: `${json.current?.wind_speed} km/h`, inline: true },
      { name: "Dirección del viento", value: json.current?.wind_dir || "NA", inline: true },
      { name: "Presión", value: `${json.current?.pressure} mb`, inline: true },
      { name: "Precipitación", value: `${json.current?.precip.toString()} mm`, inline: true },
      { name: "Humedad", value: json.current?.humidity.toString() || "NA", inline: true },
      { name: "Distancia visual", value: `${json.current?.visibility} km`, inline: true },
      { name: "Índice UV", value: json.current?.uv_index.toString() || "NA", inline: true }
    )
    .setFooter({ text: `Última comprobación en ${json.current?.observation_time} GMT` });

  return { embeds: [embed] };
}
