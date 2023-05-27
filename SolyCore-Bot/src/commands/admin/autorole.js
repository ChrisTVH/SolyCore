const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autorole",
  description: "configuración del rol que se asignará cuando un miembro se una al servidor",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<rol|off>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "add",
        description: "configurar el autorol",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "role",
            description: "el rol que hay que dar",
            type: ApplicationCommandOptionType.Role,
            required: false,
          },
          {
            name: "role_id",
            description: "la Id del rol que hay que dar",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "desactivar el autorol",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args.join(" ");
    let response;

    if (input.toLowerCase() === "off") {
      response = await setAutoRole(message, null, data.settings);
    } else {
      const roles = message.guild.findMatchingRoles(input);
      if (roles.length === 0) response = "No se han encontrado roles que coincidan con su búsqueda";
      else response = await setAutoRole(message, roles[0], data.settings);
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // agregar
    if (sub === "add") {
      let role = interaction.options.getRole("role");
      if (!role) {
        const role_id = interaction.options.getString("role_id");
        if (!role_id) return interaction.followUp("Por favor, indique un rol o Id de rol");

        const roles = interaction.guild.findMatchingRoles(role_id);
        if (roles.length === 0) return interaction.followUp("No se han encontrado roles que coincidan con su búsqueda");
        role = roles[0];
      }

      response = await setAutoRole(interaction, role, data.settings);
    }

    // borrar
    else if (sub === "remove") {
      response = await setAutoRole(interaction, null, data.settings);
    }

    // por defecto
    else response = "Subcomando invalido";

    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").Message | import("discord.js").CommandInteraction} message
 * @param {import("discord.js").Role} role
 * @param {import("@models/Guild")} settings
 */
async function setAutoRole({ guild }, role, settings) {
  if (role) {
    if (role.id === guild.roles.everyone.id) return "No se puede establecer `@everyone` como autorol";
    if (!guild.members.me.permissions.has("ManageRoles")) return "No tengo el permiso `ManageRoles`.";
    if (guild.members.me.roles.highest.position < role.position)
      return "No tengo permisos para asignar este rol";
    if (role.managed) return "¡Uy! Esta función está gestionada por una integración";
  }

  if (!role) settings.autorole = null;
  else settings.autorole = role.id;

  await settings.save();
  return `¡Configuración guardada! el Autorol es ${!role ? "deshabilitado" : "configurado"}`;
}
