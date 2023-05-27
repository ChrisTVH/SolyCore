const { ChannelType } = require("discord.js");
const move = require("../shared/move");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "move",
  description: "mover el miembro especificado al canal de voz",
  category: "MODERATION",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],
  command: {
    enabled: true,
    usage: "<ID|@miembro <canal> [razón]",
    minArgsCount: 1,
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`No se ha encontrado ningún usuario que coincida ${args[0]}`);

    const channels = message.guild.findMatchingChannels(args[1]);
    if (!channels.length) return message.safeReply("No se han encontrado canales coincidentes");
    const targetChannel = channels.pop();
    if (!targetChannel.type === ChannelType.GuildVoice && !targetChannel.type === ChannelType.GuildStageVoice) {
      return message.safeReply("El canal de destino no es un canal de voz");
    }

    const reason = args.slice(2).join(" ");
    const response = await move(message, target, reason, targetChannel);
    await message.safeReply(response);
  },
};
