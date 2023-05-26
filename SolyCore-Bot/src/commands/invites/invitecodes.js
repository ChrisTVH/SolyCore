const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "invitecodes",
  description: "lista de todos los códigos de invitación en este servidor",
  category: "INVITE",
  botPermissions: ["EmbedLinks", "ManageGuild"],
  command: {
    enabled: true,
    usage: "[@miembro|id]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "al usuario que obtendrá los códigos de invitación para",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const target = (await message.guild.resolveMember(args[0])) || message.member;
    const response = await getInviteCodes(message, target.user);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await getInviteCodes(interaction, user);
    await interaction.followUp(response);
  },
};

async function getInviteCodes({ guild }, user) {
  const invites = await guild.invites.fetch({ cache: false });
  const reqInvites = invites.filter((inv) => inv.inviter.id === user.id);
  if (reqInvites.size === 0) return `\`${user.tag}\` no tiene invitaciones en este servidor`;

  let str = "";
  reqInvites.forEach((inv) => {
    str += `❯ [${inv.code}](${inv.url}) : ${inv.uses} usos\n`;
  });

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Código de invitación para ${user.username}` })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(str);

  return { embeds: [embed] };
}
