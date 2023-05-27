const { musicValidations } = require("@helpers/BotUtils");
const { LoopType } = require("@lavaclient/queue");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "loop",
  description: "pone en bucle la canción o la cola",
  category: "MUSIC",
  validations: musicValidations,
  command: {
    enabled: true,
    minArgsCount: 1,
    usage: "<cola|pista>",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "type",
        type: ApplicationCommandOptionType.String,
        description: "La entidad que desea incluir en el bucle",
        required: false,
        choices: [
          {
            name: "queue",
            value: "queue",
          },
          {
            name: "track",
            value: "track",
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const input = args[0].toLowerCase();
    const type = input === "queue" ? "queue" : "track";
    const response = toggleLoop(message, type);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const type = interaction.options.getString("type") || "track";
    const response = toggleLoop(interaction, type);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {"queue"|"track"} type
 */
function toggleLoop({ client, guildId }, type) {
  const player = client.musicManager.getPlayer(guildId);

  // pista
  if (type === "track") {
    player.queue.setLoop(LoopType.Song);
    return "El modo bucle está ajustado a `pista`";
  }

  // cola
  else if (type === "queue") {
    player.queue.setLoop(1);
    return "El modo de bucle se establece en `cola`";
  }
}
