const { addReactionRole, getReactionRoles } = require("@schemas/ReactionRoles");
const { parseEmoji, ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { parsePermissions } = require("@helpers/Utils");

const channelPerms = ["EmbedLinks", "ReadMessageHistory", "AddReactions", "UseExternalEmojis", "ManageMessages"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "addrr",
  description: "configurar la función de reacción para el mensaje especificado",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<#canal> <mensajeId> <emoticono> <rol>",
    minArgsCount: 4,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "channel",
        description: "canal en el que existe el mensaje",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
      {
        name: "message_id",
        description: "Id de mensaje al que deben configurarse los roles de reacción",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "emoji",
        description: "emoji a utilizar",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "role",
        description: "función que se dará al emoji seleccionado",
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const targetChannel = message.guild.findMatchingChannels(args[0]);
    if (targetChannel.length === 0) return message.safeReply(`No se han encontrado canales que coincidan ${args[0]}`);

    const targetMessage = args[1];

    const role = message.guild.findMatchingRoles(args[3])[0];
    if (!role) return message.safeReply(`No se han encontrado funciones que coincidan ${args[3]}`);

    const reaction = args[2];

    const response = await addRR(message.guild, targetChannel[0], targetMessage, reaction, role);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("channel");
    const messageId = interaction.options.getString("message_id");
    const reaction = interaction.options.getString("emoji");
    const role = interaction.options.getRole("role");

    const response = await addRR(interaction.guild, targetChannel, messageId, reaction, role);
    await interaction.followUp(response);
  },
};

async function addRR(guild, channel, messageId, reaction, role) {
  if (!channel.permissionsFor(guild.members.me).has(channelPerms)) {
    return `Necesita los siguientes permisos en ${channel.toString()}\n${parsePermissions(channelPerms)}`;
  }

  let targetMessage;
  try {
    targetMessage = await channel.messages.fetch({ message: messageId });
  } catch (ex) {
    return "No se ha podido recuperar el mensaje. ¿Ha proporcionado un mensajeId válido?";
  }

  if (role.managed) {
    return "No puedo asignar roles de bots.";
  }

  if (guild.roles.everyone.id === role.id) {
    return "You cannot assign the everyone role.";
  }

  if (guild.members.me.roles.highest.position < role.position) {
    return "¡Uy! No puedo añadir/eliminar miembros en ese rol. ¿Ese rol es superior al mío?";
  }

  const custom = parseEmoji(reaction);
  if (custom.id && !guild.emojis.cache.has(custom.id)) return "Este emoji no pertenece a este servidor";
  const emoji = custom.id ? custom.id : custom.name;

  try {
    await targetMessage.react(emoji);
  } catch (ex) {
    return `¡Uy! No he reaccionado. ¿Es este un emoji válido: ${reaction} ?`;
  }

  let reply = "";
  const previousRoles = getReactionRoles(guild.id, channel.id, targetMessage.id);
  if (previousRoles.length > 0) {
    const found = previousRoles.find((rr) => rr.emote === emoji);
    if (found) reply = "Ya hay un rol configurado para este emoji. Sobrescribir datos,\n";
  }

  await addReactionRole(guild.id, channel.id, targetMessage.id, emoji, role.id);
  return (reply += "¡Listo! Configuración guardada");
}
