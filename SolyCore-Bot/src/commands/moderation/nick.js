const { canModerate } = require("@helpers/ModUtils");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "nick",
  description: "comandos de apodo",
  category: "MODERATION",
  botPermissions: ["ManageNicknames"],
  userPermissions: ["ManageNicknames"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "set <@miembro> <nombre>",
        description: "establece el apodo del miembro especificado",
      },
      {
        trigger: "reset <@miembro>",
        description: "restablecer el apodo de un miembro",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "set",
        description: "cambiar el apodo de un miembro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el miembro cuyo apodo quieres establecer",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "name",
            description: "el apodo a establecer",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reset",
        description: "restablecer el apodo de un miembro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "los miembros cuyo apodo quieres restablecer",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if (sub === "set") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("No se ha encontrado ningún miembro");
      const name = args.slice(2).join(" ");
      if (!name) return message.safeReply("Especifique un apodo");

      const response = await nickname(message, target, name);
      return message.safeReply(response);
    }

    //
    else if (sub === "reset") {
      const target = await message.guild.resolveMember(args[1]);
      if (!target) return message.safeReply("No se ha encontrado ningún miembro");

      const response = await nickname(message, target);
      return message.safeReply(response);
    }
  },

  async interactionRun(interaction) {
    const name = interaction.options.getString("name");
    const target = await interaction.guild.members.fetch(interaction.options.getUser("user"));

    const response = await nickname(interaction, target, name);
    await interaction.followUp(response);
  },
};

async function nickname({ member, guild }, target, name) {
  if (!canModerate(member, target)) {
      return `¡Uy! No se puede gestionar el apodo de ${target.user.tag}`;
  }
  if (!canModerate(guild.members.me, target)) {
      return `¡Uy! No se puede gestionar el apodo de ${target.user.tag}`;
  }

  try {
    await target.setNickname(name);
    return `Con éxito se ${name ? "cambio" : "restablecio"} el apodo de ${target.user.tag}`;
  } catch (ex) {
    return `Fallo al ${name ? "cambiar" : "restablecer"} el apodo de ${target.displayName}. ¿Ha indicado un nombre válido?`;
  }
}
