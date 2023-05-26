const { EMBED_COLORS } = require("@root/config");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "queue",
  description: "muestra la cola de música actual",
  category: "MUSIC",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[página]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "page",
        description: "número de página",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1;
    const response = getQueue(message, page);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const page = interaction.options.getInteger("page");
    const response = getQueue(interaction, page);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {number} pgNo
 */
function getQueue({ client, guild }, pgNo) {
  const player = client.musicManager.getPlayer(guild.id);
  if (!player) return "🚫 En este servidor no suena música.";

  const queue = player.queue;
  const embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED).setAuthor({ name: `Queue for ${guild.name}` });

  // cambio para la cantidad de pistas por página
  const multiple = 10;
  const page = pgNo || 1;

  const end = page * multiple;
  const start = end - multiple;

  const tracks = queue.tracks.slice(start, end);

  if (queue.current) embed.addFields({ name: "Actual", value: `[${queue.current.title}](${queue.current.uri})` });
  if (!tracks.length) embed.setDescription(`No hay pistas en ${page > 1 ? `página ${page}` : "la cola"}.`);
  else embed.setDescription(tracks.map((track, i) => `${start + ++i} - [${track.title}](${track.uri})`).join("\n"));

  const maxPages = Math.ceil(queue.tracks.length / multiple);

  embed.setFooter({ text: `Página ${page > maxPages ? maxPages : page} de ${maxPages}` });

  return { embeds: [embed] };
}
