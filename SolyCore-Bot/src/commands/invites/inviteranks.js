const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "inviteranks",
  description: "muestra los rangos de invitación configurados en este en este servidor",
  category: "INVITE",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args, data) {
    const response = await getInviteRanks(message, data.settings);
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const response = await getInviteRanks(interaction, data.settings);
    await interaction.followUp(response);
  },
};

async function getInviteRanks({ guild }, settings) {
  if (settings.invite.ranks.length === 0) return "No hay rangos de invitación configurados en este servidor";
  let str = "";

  settings.invite.ranks.forEach((data) => {
    const roleName = guild.roles.cache.get(data._id)?.toString();
    if (roleName) {
      str += `❯ ${roleName}: ${data.invites} invitaciones\n`;
    }
  });

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Rangos de invitación" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(str);
  return { embeds: [embed] };
}
