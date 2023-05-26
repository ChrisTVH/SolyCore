const { musicValidations } = require("@helpers/BotUtils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "resume",
  description: "reanuda el reproductor de música",
  category: "MUSIC",
  validations: musicValidations,
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const response = resumePlayer(message);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const response = resumePlayer(interaction);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 */
function resumePlayer({ client, guildId }) {
  const player = client.musicManager.getPlayer(guildId);
  if (!player.paused) return "El reproductor ya está reanudado";
  player.resume();
  return "▶️ Reanudando el reproductor de música";
}
