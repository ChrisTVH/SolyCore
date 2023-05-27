const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ticketcat",
  description: "gestionar categorías de tickets",
  category: "TICKET",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "list",
        description: "lista de todas las categorías de entradas",
      },
      {
        trigger: "add <categoría> | <staff_rol>",
        description: "añadir una categoría de ticket",
      },
      {
        trigger: "remove <categoría>",
        description: "eliminar una categoría de ticket",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "list",
        description: "lista de todas las categorías de ticket",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "add",
        description: "añadir una categoría de ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "category",
            description: "el nombre de la categoría",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "staff_roles",
            description: "los roles del personal",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "remove",
        description: "eliminar una categoría de ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "category",
            description: "el nombre de la categoría",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const sub = args[0].toLowerCase();
    let response;

    // lista
    if (sub === "list") {
      response = listCategories(data);
    }

    // Agregar
    else if (sub === "add") {
      const split = args.slice(1).join(" ").split("|");
      const category = split[0].trim();
      const staff_roles = split[1]?.trim();
      response = await addCategory(message.guild, data, category, staff_roles);
    }

    // remover
    else if (sub === "remove") {
      const category = args.slice(1).join(" ").trim();
      response = await removeCategory(data, category);
    }

    // subcomando no válido
    else {
      response = "Subcomando no válido.";
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // lista
    if (sub === "list") {
      response = listCategories(data);
    }

    // agregar
    else if (sub === "add") {
      const category = interaction.options.getString("category");
      const staff_roles = interaction.options.getString("staff_roles");
      response = await addCategory(interaction.guild, data, category, staff_roles);
    }

    // remover
    else if (sub === "remove") {
      const category = interaction.options.getString("category");
      response = await removeCategory(data, category);
    }

    //
    else response = "Subcomando no válido";
    await interaction.followUp(response);
  },
};

function listCategories(data) {
  const categories = data.settings.ticket.categories;
  if (categories?.length === 0) return "No se han encontrado categorías de entradas.";

  const fields = [];
  for (const category of categories) {
    const roleNames = category.staff_roles.map((r) => `<@&${r}>`).join(", ");
    fields.push({ name: category.name, value: `**Staff:** ${roleNames || "Nada"}` });
  }
  const embed = new EmbedBuilder().setAuthor({ name: "Categorías de tickets" }).addFields(fields);
  return { embeds: [embed] };
}

async function addCategory(guild, data, category, staff_roles) {
  if (!category) return "Uso no válido. Falta el nombre de la categoría.";

  // comprobar si la categoría ya existe
  if (data.settings.ticket.categories.find((c) => c.name === category)) {
    return `Categoría \`${category}\` ya existe.`;
  }

  const staffRoles = (staff_roles?.split(",")?.map((r) => r.trim()) || []).filter((r) => guild.roles.cache.has(r));

  data.settings.ticket.categories.push({ name: category, staff_roles: staffRoles });
  await data.settings.save();

  return `La Categoría \`${category}\` fue añadida.`;
}

async function removeCategory(data, category) {
  const categories = data.settings.ticket.categories;
  // comprobar si existe la categoría
  if (!categories.find((c) => c.name === category)) {
    return `La categoría \`${category}\` no existe.`;
  }

  data.settings.ticket.categories = categories.filter((c) => c.name !== category);
  await data.settings.save();

  return `La categoría \`${category}\` fue borrada.`;
}
