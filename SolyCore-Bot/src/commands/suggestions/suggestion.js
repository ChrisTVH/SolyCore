const { approveSuggestion, rejectSuggestion } = require("@handlers/suggestion");
const { parsePermissions } = require("@helpers/Utils");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

const CHANNEL_PERMS = ["ViewChannel", "SendMessages", "EmbedLinks", "ManageMessages", "ReadMessageHistory"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "suggestion",
  description: "configurar el sistema de sugerencias",
  category: "SUGGESTION",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "estado <on|off>",
        description: "activar/desactivar el sistema de sugerencias",
      },
      {
        trigger: "canal <#canal|off>",
        description: "configurar el canal de sugerencias o desactivarlo",
      },
      {
        trigger: "aprobado <#canal>",
        description: "configurar el canal de sugerencias aprobado o desactivarlo",
      },
      {
        trigger: "negado <#canal>",
        description: "configurar el canal de sugerencias rechazadas o desactivarlo",
      },
      {
        trigger: "approve <canal> <mensajeId> [razón]",
        description: "aprobar una sugerencia",
      },
      {
        trigger: "reject <canal> <mensajeId> [razón]",
        description: "rechazar una sugerencia",
      },
      {
        trigger: "staffadd <rolId>",
        description: "añadir una función de personal",
      },
      {
        trigger: "staffremove <rolId>",
        description: "eliminar una función del personal",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "activar o desactivar el estado de las sugerencias",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "activado o desactivado",
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
      {
        name: "channel",
        description: "configurar el canal de sugerencias o desactivarlo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "el canal al que se enviarán las sugerencias",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "appch",
        description: "configurar el canal de sugerencias aprobado o desactivarlo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "el canal al que se enviarán las sugerencias aprobadas",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "rejch",
        description: "configurar el canal de sugerencias rechazadas o desactivarlo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "el canal al que se enviarán las sugerencias rechazadas",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
          },
        ],
      },
      {
        name: "approve",
        description: "aprobar una sugerencia",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "el canal donde existe el mensaje",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: "message_id",
            description: "el Id del mensaje de la sugerencia",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "reason",
            description: "el motivo de la aprobación",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "reject",
        description: "rechazar una sugerencia",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel_name",
            description: "el canal donde existe el mensaje",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
          {
            name: "message_id",
            description: "el id del mensaje de la sugerencia",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "reason",
            description: "el motivo del rechazo",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "staffadd",
        description: "añadir el rol staff",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "el rol para añadir como staff",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: "staffremove",
        description: "remover el rol de staff",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "el rol para remover a un staff",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0];
    let response;

    // estado
    if (sub == "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Estado no válido. El valor debe ser `on/off`");
      response = await setStatus(data.settings, status);
    }

    // canal
    else if (sub == "channel") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `No se han encontrado canales para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios canales para ${input}. Por favor, sea más específico.`;
      else response = await setChannel(data.settings, matched[0]);
    }

    // aprobar
    else if (sub == "appch") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `No se han encontrado canales para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios canales para ${input}. Por favor, sea más específico.`;
      else response = await setApprovedChannel(data.settings, matched[0]);
    }

    // aprobar
    else if (sub == "rejch") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `No se han encontrado canales para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios canales para ${input}. Por favor, sea más específico.`;
      else response = await setRejectedChannel(data.settings, matched[0]);
    }

    // aprobado
    else if (sub == "approve") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `No se han encontrado canales para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios canales para ${input}. Por favor, sea más específico.`;
      else {
        const messageId = args[2];
        const reason = args.slice(3).join(" ");
        response = await approveSuggestion(message.member, matched[0], messageId, reason);
      }
    }

    // rechazar
    else if (sub == "reject") {
      const input = args[1];
      let matched = message.guild.findMatchingChannels(input);
      if (matched.length == 0) response = `No se han encontrado canales para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios canales para ${input}. Por favor, sea más específico.`;
      else {
        const messageId = args[2];
        const reason = args.slice(3).join(" ");
        response = await rejectSuggestion(message.member, matched[0], messageId, reason);
      }
    }

    // añadir staff
    else if (sub == "staffadd") {
      const input = args[1];
      let matched = message.guild.findMatchingRoles(input);
      if (matched.length == 0) response = `No se han encontrado roles coincidentes para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios roles para ${input}. Por favor, sea más específico.`;
      else response = await addStaffRole(data.settings, matched[0]);
    }

    // remover staff
    else if (sub == "staffremove") {
      const input = args[1];
      let matched = message.guild.findMatchingRoles(input);
      if (matched.length == 0) response = `No se han encontrado roles coincidentes para ${input}`;
      else if (matched.length > 1)
        response = `Se han encontrado varios roles para ${input}. Por favor, sea más específico.`;
      else response = await removeStaffRole(data.settings, matched[0]);
    }

    // si no
    else response = "No es un subcomando válido";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // estado
    if (sub == "status") {
      const status = interaction.options.getString("status");
      response = await setStatus(data.settings, status);
    }

    // canal
    else if (sub == "channel") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setChannel(data.settings, channel);
    }

    // canal de aprovación
    else if (sub == "appch") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setApprovedChannel(data.settings, channel);
    }

    // canal de rechazo
    else if (sub == "rejch") {
      const channel = interaction.options.getChannel("channel_name");
      response = await setRejectedChannel(data.settings, channel);
    }

    // aprobado
    else if (sub == "approve") {
      const channel = interaction.options.getChannel("channel_name");
      const messageId = interaction.options.getString("message_id");
      response = await approveSuggestion(interaction.member, channel, messageId);
    }

    // rechazado
    else if (sub == "reject") {
      const channel = interaction.options.getChannel("channel_name");
      const messageId = interaction.options.getString("message_id");
      response = await rejectSuggestion(interaction.member, channel, messageId);
    }

    // añadir staff
    else if (sub == "staffadd") {
      const role = interaction.options.getRole("role");
      response = await addStaffRole(data.settings, role);
    }

    // staff removido
    else if (sub == "staffremove") {
      const role = interaction.options.getRole("role");
      response = await removeStaffRole(data.settings, role);
    }

    // si no
    else response = "No es un subcomando válido";
    await interaction.followUp(response);
  },
};

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.suggestions.enabled = enabled;
  await settings.save();
  return `El sistema de sugerencias es ahora ${enabled ? "habilitado" : "deshabilitado"}`;
}

async function setChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.channel_id = null;
    await settings.save();
    return "El sistema de sugerencias está desactivado";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Necesito los siguientes permisos en ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.channel_id = channel.id;
  await settings.save();
  return `Las sugerencias se enviarán ahora a ${channel}`;
}

async function setApprovedChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.approved_channel = null;
    await settings.save();
    return "El canal de sugerencias aprobadas está desactivado";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Necesito los siguientes permisos en ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.approved_channel = channel.id;
  await settings.save();
  return `Las sugerencias aprobadas se enviarán ahora a ${channel}`;
}

async function setRejectedChannel(settings, channel) {
  if (!channel) {
    settings.suggestions.rejected_channel = null;
    await settings.save();
    return "El canal de sugerencias rechazadas está ahora desactivado";
  }

  if (!channel.permissionsFor(channel.guild.members.me).has(CHANNEL_PERMS)) {
    return `Necesito los siguientes permisos en ${channel}\n${parsePermissions(CHANNEL_PERMS)}`;
  }

  settings.suggestions.rejected_channel = channel.id;
  await settings.save();
  return `Las sugerencias rechazadas se enviarán ahora a ${channel}`;
}

async function addStaffRole(settings, role) {
  if (settings.suggestions.staff_roles.includes(role.id)) {
    return `\`${role.name}\` ya tiene el rol del staff`;
  }
  settings.suggestions.staff_roles.push(role.id);
  await settings.save();
  return `\`${role.name}\` el rol staff es ahora`;
}

async function removeStaffRole(settings, role) {
  if (!settings.suggestions.staff_roles.includes(role.id)) {
    return `${role} no es un rol de staff`;
  }
  settings.suggestions.staff_roles.splice(settings.suggestions.staff_roles.indexOf(role.id), 1);
  await settings.save();
  return `\`${role.name}\` ya no forma parte del staff`;
}
