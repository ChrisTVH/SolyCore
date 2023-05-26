const { musicValidations } = require("@helpers/BotUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "skip",
  description: "saltar la canción actual",
  category: "MUSIC",
  validations: musicValidations,
  command: {
    enabled: true,
    aliases: ["next"],
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = skip(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = skip(interaction);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
function skip({ client, guildId }) {
  const player = client.musicManager.getPlayer(guildId);

  // comprueba si se está reproduciendo la canción actual
  if (!player.queue.current) return "⏯️ No se está reproduciendo ninguna canción";

  const { title } = player.queue.current;
  return player.queue.next() ? `⏯️ ${title} was skipped.` : "⏯️ No hay ninguna canción que saltar.";
}
