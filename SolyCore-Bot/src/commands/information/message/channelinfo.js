const channelInfo = require("../shared/channel");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "channelinfo",
  description: "muestra información sobre un canal",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[#canal|id]",
    aliases: ["chinfo"],
  },

  async messageRun(message, args) {
    let targetChannel;

    if (message.mentions.channels.size > 0) {
      targetChannel = message.mentions.channels.first();
    }

    // buscar canal por nombre/ID
    else if (args.length > 0) {
      const search = args.join(" ");
      const tcByName = message.guild.findMatchingChannels(search);
      if (tcByName.length === 0) return message.safeReply(`No se han encontrado canales que coincidan \`${search}\`!`);
      if (tcByName.length > 1) return message.safeReply(`Se han encontrado varios canales coincidentes \`${search}\`!`);
      [targetChannel] = tcByName;
    } else {
      targetChannel = message.channel;
    }

    const response = channelInfo(targetChannel);
    await message.safeReply(response);
  },
};
