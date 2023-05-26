const { getMember } = require("@schemas/Member");
const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "invitesimport",
  description: "añadir invitaciones del servidor existentes a los usuarios",
  category: "INVITE",
  botPermissions: ["ManageGuild"],
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "[@member]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "el usuario al que se le importaran las invitaciones para",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = await message.guild.resolveMember(args[0]);
    const response = await importInvites(message, target?.user);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const response = await importInvites(interaction, user);
    await interaction.followUp(response);
  },
};

async function importInvites({ guild }, user) {
  if (user && user.bot) return "¡Ups! No se pueden importar invitaciones a los bots";

  const invites = await guild.invites.fetch({ cache: false });

  // almacén temporal para invitaciones
  const tempMap = new Map();

  for (const invite of invites.values()) {
    const inviter = invite.inviter;
    if (!inviter || invite.uses === 0) continue;
    if (!tempMap.has(inviter.id)) tempMap.set(inviter.id, invite.uses);
    else {
      const uses = tempMap.get(inviter.id) + invite.uses;
      tempMap.set(inviter.id, uses);
    }
  }

  for (const [userId, uses] of tempMap.entries()) {
    const memberDb = await getMember(guild.id, userId);
    memberDb.invite_data.added += uses;
    await memberDb.save();
  }

  return `Listo Invitaciones anteriores añadidas a ${user ? user.tag : "todos los miembros"}`;
}
