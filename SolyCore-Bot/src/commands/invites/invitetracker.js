const { cacheGuildInvites, resetInviteCache } = require("@handlers/invite");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "invitetracker",
  description: "activar o desactivar el seguimiento de invitaciones en el servidor",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    aliases: ["invitetracking"],
    usage: "<ON|OFF>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "status",
        description: "estado de configuración",
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "ON",
            value: "ON",
          },
          {
            name: "OFF",
            value: "OFF",
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const status = args[0].toLowerCase();
    if (!["on", "off"].includes(status)) return message.safeReply("Estado no válido. El valor debe ser `on/off`");
    const response = await setStatus(message, status, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const status = interaction.options.getString("status");
    const response = await setStatus(interaction, status, data.settings);
    await interaction.followUp(response);
  },
};

async function setStatus({ guild }, input, settings) {
  const status = input.toUpperCase() === "ON" ? true : false;

  if (status) {
    if (!guild.members.me.permissions.has(["ManageGuild", "ManageChannels"])) {
      return "¡Ups! Me faltan los permisos `Gestionar servidor` y `Gestionar canales`.\nNo puedo rastrear las invitaciones";
    }

    const channelMissing = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText && !ch.permissionsFor(guild.members.me).has("ManageChannels"))
      .map((ch) => ch.name);

    if (channelMissing.length > 1) {
      return `Puede que no sea capaz de rastrear las invitaciones correctamente\nMe estoy perdiendo el permiso \`Manage Channel\` de los siguientes canales \`\`\`${channelMissing.join(
        ", "
      )}\`\`\``;
    }

    await cacheGuildInvites(guild);
  } else {
    resetInviteCache(guild.id);
  }

  settings.invite.tracking = status;
  await settings.save();

  return `¡Configuración guardada! El seguimiento de invitaciones es ahora ${status ? "habilitado" : "deshabilitado"}`;
}
