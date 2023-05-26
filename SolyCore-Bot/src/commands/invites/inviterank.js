const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "inviterank",
  description: "configurar los rangos de invitaci�n",
  category: "INVITE",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<nombre-rol> <invitaciones>",
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "add <roles> <invitaciones>",
        description: "a�adir auto-rango despu�s de alcanzar un n�mero determinado de invitaciones",
      },
      {
        trigger: "remove role",
        description: "eliminar el rango de invitaci�n configurado con ese rol",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "a�adir un nuevo rango de invitaci�n",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "papel que debe desempe�ar",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
          {
            name: "invites",
            description: "n�mero de invitaciones necesarias para obtener el puesto",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "eliminar un rango de invitaci�n previamente configurado",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "rol con rango de invitaci�n configurado",
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0].toLowerCase();

    if (sub === "add") {
      const query = args[1];
      const invites = args[2];

      if (isNaN(invites)) return message.safeReply(`\`${invites}\` no es un n�mero v�lido de invitaciones?`);
      const role = message.guild.findMatchingRoles(query)[0];
      if (!role) return message.safeReply(`No se han encontrado roles que coincidan \`${query}\``);

      const response = await addInviteRank(message, role, invites, data.settings);
      await message.safeReply(response);
    }

    //
    else if (sub === "remove") {
      const query = args[1];
      const role = message.guild.findMatchingRoles(query)[0];
      if (!role) return message.safeReply(`No se han encontrado roles que coincidan \`${query}\``);
      const response = await removeInviteRank(message, role, data.settings);
      await message.safeReply(response);
    }

    //
    else {
      await message.safeReply("Uso incorrecto de comandos.");
    }
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    //
    if (sub === "add") {
      const role = interaction.options.getRole("role");
      const invites = interaction.options.getInteger("invites");

      const response = await addInviteRank(interaction, role, invites, data.settings);
      await interaction.followUp(response);
    }

    //
    else if (sub === "remove") {
      const role = interaction.options.getRole("role");
      const response = await removeInviteRank(interaction, role, data.settings);
      await interaction.followUp(response);
    }
  },
};

async function addInviteRank({ guild }, role, invites, settings) {
  if (!settings.invite.tracking) return `El seguimiento de invitaciones est� desactivado en este servidor`;

  if (role.managed) {
    return "No se puede asignar un rol de bot";
  }

  if (guild.roles.everyone.id === role.id) {
    return "No puedo asignar el rol de todos.";
  }

  if (!role.editable) {
    return "Me faltan permisos para mover miembros a ese rol. �Ese rol est� por debajo de mi rol m�s alto?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);

  let msg = "";
  if (exists) {
    exists.invites = invites;
    msg += "Configuraci�n previa encontrada para este rol. Sobrescritura de datos\n";
  }

  settings.invite.ranks.push({ _id: role.id, invites });
  await settings.save();
  return `${msg}��xito! Configuraci�n guardada.`;
}

async function removeInviteRank({ guild }, role, settings) {
  if (!settings.invite.tracking) return `El seguimiento de invitaciones est� desactivado en este servidor`;

  if (role.managed) {
    return "No se puede asignar un rol de bot";
  }

  if (guild.roles.everyone.id === role.id) {
    return "No se puede asignar el rol everyone.";
  }

  if (!role.editable) {
    return "Me faltan permisos para mover miembros de ese rol. �Ese rol est� por debajo de mi rol m�s alto?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);
  if (!exists) return "No se ha configurado ning�n rango de invitaci�n anterior para este rol";

  // eliminar elemento del array
  const i = settings.invite.ranks.findIndex((obj) => obj._id === role.id);
  if (i > -1) settings.invite.ranks.splice(i, 1);

  await settings.save();
  return "��xito! Configuraci�n guardada.";
}
