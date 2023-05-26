const { EmbedBuilder, ChannelType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { stripIndent } = require("common-tags");
const channelTypes = require("@helpers/channelTypes");

/**
 * @param {import('discord.js').GuildChannel} channel
 */
module.exports = (channel) => {
  const { id, name, parent, position, type } = channel;

  let desc = stripIndent`
      ❯ ID: **${id}**
      ❯ Nombre: **${name}**
      ❯ Tipo: **${channelTypes(channel.type)}**
      ❯ Categoría: **${parent || "NA"}**\n
      `;

  if (type === ChannelType.GuildText) {
    const { rateLimitPerUser, nsfw } = channel;
    desc += stripIndent`
      ❯ Tema: **${channel.topic || "Ningún tema fijado"}**
      ❯ Posición: **${position}**
      ❯ Modo lento: **${rateLimitPerUser}**
      ❯ esNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildPublicThread || type === ChannelType.GuildPrivateThread) {
    const { ownerId, archived, locked } = channel;
    desc += stripIndent`
      ❯ Propietario Id: **${ownerId}**
      ❯ Está archivado: **${archived ? "✓" : "✕"}**
      ❯ Está bloqueado: **${locked ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildNews || type === ChannelType.GuildNewsThread) {
    const { nsfw } = channel;
    desc += stripIndent`
      ❯ esNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    const { bitrate, userLimit, full } = channel;
    desc += stripIndent`
      ❯ Posición: **${position}**
      ❯ Tasa de bits: **${bitrate}**
      ❯ Límite de usuarios: **${userLimit}**
      ❯ estaLleno: **${full ? "✓" : "✕"}**\n
      `;
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Detalles del canal" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc);

  return { embeds: [embed] };
};
