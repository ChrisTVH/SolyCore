const { EmbedBuilder } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.available) return;
  client.logger.log(`Servidor abandonado: ${guild.name} Miembros: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  settings.data.leftAt = new Date();
  await settings.save();

  if (!client.joinLeaveWebhook) return;

  let ownerTag;
  const ownerId = guild.ownerId || settings.data.owner;
  try {
    const owner = await client.users.fetch(ownerId);
    ownerTag = owner.tag;
  } catch (err) {
    ownerTag = "Usuario borrado";
  }

  const embed = new EmbedBuilder()
    .setTitle("Servidor abandonado")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.ERROR)
    .addFields(
      {
        name: "Nombre de servidor",
        value: guild.name || "NA",
        inline: false,
      },
      {
        name: "ID",
        value: guild.id,
        inline: false,
      },
      {
        name: "Dueño",
        value: `${ownerTag} [\`${ownerId}\`]`,
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
    username: "Leave",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
