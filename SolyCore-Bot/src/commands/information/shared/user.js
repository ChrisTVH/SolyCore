const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

/**
 * @param {import('discord.js').GuildMember} member
 */
module.exports = (member) => {
  let color = member.displayHexColor;
  if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;

  let rolesString = member.roles.cache.map((r) => r.name).join(", ");
  if (rolesString.length > 1024) rolesString = rolesString.substring(0, 1020) + "...";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Información del usuario para ${member.displayName}`,
      iconURL: member.user.displayAvatarURL(),
    })
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(color)
    .addFields(
      {
        name: "Etiqueta de usuario",
        value: member.user.tag,
        inline: true,
      },
      {
        name: "ID",
        value: member.id,
        inline: true,
      },
      {
        name: "Unido al servidor",
        value: member.joinedAt.toUTCString(),
      },
      {
        name: "Registrado en Discord",
        value: member.user.createdAt.toUTCString(),
      },
      {
        name: `Roles [${member.roles.cache.size}]`,
        value: rolesString,
      },
      {
        name: "Avatar-URL",
        value: member.user.displayAvatarURL({ extension: "png" }),
      }
    )
    .setFooter({ text: `Solicitado por ${member.user.tag}` })
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
