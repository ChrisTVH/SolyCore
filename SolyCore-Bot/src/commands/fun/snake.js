const SnakeGame = require("snakecord");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "snake",
  description: "jugar al juego de la serpiente en discord",
  cooldown: 300,
  category: "FUN",
  botPermissions: ["SendMessages", "EmbedLinks", "AddReactions", "ReadMessageHistory", "ManageMessages"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    await message.safeReply("**Inicio del juego de la serpiente**");
    await startSnakeGame(message);
  },

  async interactionRun(interaction) {
    await interaction.followUp("**Comenzar el juego de la serpiente**");
    await startSnakeGame(interaction);
  },
};

async function startSnakeGame(data) {
  const snakeGame = new SnakeGame({
    title: "El juego de la serpiente",
    color: "BLUE",
    timestamp: true,
    gameOverTitle: "Se acabó el juego",
  });

  await snakeGame.newGame(data);
}
