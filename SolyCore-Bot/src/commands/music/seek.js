const { musicValidations } = require("@helpers/BotUtils");
const prettyMs = require("pretty-ms");
const { durationToMillis } = require("@helpers/Utils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "seek",
  description: "fija la posici�n de la pista en reproducci�n en la posici�n especificada",
  category: "MUSIC",
  validations: musicValidations,
  command: {
    enabled: true,
    usage: "<duraci�n>",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "time",
        description: "El tiempo que desea buscar a.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const time = args.join(" ");
    const response = seekTo(message, time);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const time = interaction.options.getString("time");
    const response = seekTo(interaction, time);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {number} time
 */
function seekTo({ client, guildId }, time) {
  const player = client.musicManager?.getPlayer(guildId);
  const seekTo = durationToMillis(time);

  if (seekTo > player.queue.current.length) {
      return "La duraci�n indicada supera la duraci�n de la pista actual.";
  }

  player.seek(seekTo);
  return `Buscaba ${prettyMs(seekTo, { colonNotation: true, secondsDecimalDigits: 0 })}`;
}
