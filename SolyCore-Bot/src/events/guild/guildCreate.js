const { EmbedBuilder } = require("discord.js");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true }).catch(() => {});
  client.logger.log(`Unido al servidor: ${guild.name} Miembros: ${guild.memberCount}`);
  await registerGuild(guild);

  if (!client.joinLeaveWebhook) return;

  const embed = new EmbedBuilder()
    .setTitle("Unido al servidor")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.SUCCESS)
    .addFields(
      {
        name: "Nombre del servidor",
        value: guild.name,
        inline: false,
      },
      {
        name: "ID",
        value: guild.id,
        inline: false,
      },
      {
        name: "Dueño",
        value: `${client.users.cache.get(guild.ownerId).tag} [\`${guild.ownerId}\`]`,
        inline: false,
      },
      {
        name: "Miembros",
        value: `\`\`\`yaml\n${guild.memberCount}\`\`\``,
        inline: false,
      }
    )
    .setFooter({ text: `Servidor #${client.guilds.cache.size}` });

  client.joinLeaveWebhook.send({
    username: "Join",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
