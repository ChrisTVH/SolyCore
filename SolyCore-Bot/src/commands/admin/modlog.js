const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "modlog",
  description: "activar o desactivar los registros de moderación",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<#canal|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "canales para enviar registros",
        required: false,
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    let targetChannel;

    if (input === "none" || input === "off" || input === "disable") targetChannel = null;
    else {
      if (message.mentions.channels.size === 0) return message.safeReply("Uso incorrecto del comando");
      targetChannel = message.mentions.channels.first();
    }

    const response = await setChannel(targetChannel, data.settings);
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const channel = interaction.options.getChannel("channel");
    const response = await setChannel(channel, data.settings);
    return interaction.followUp(response);
  },
};

async function setChannel(targetChannel, settings) {
  if (!targetChannel && !settings.modlog_channel) {
    return "Ya está desactivado";
  }

  if (targetChannel && !targetChannel.canSendEmbeds()) {
    return "¡Uf! ¿No puedo enviar logs a ese canal? Necesito los permisos `Write Messages` y `Embed Links` en ese canal.";
  }

  settings.modlog_channel = targetChannel?.id;
  await settings.save();
  return `¡Configuración guardada! Canal Modlog ${targetChannel ? "updated" : "removed"}`;
}
