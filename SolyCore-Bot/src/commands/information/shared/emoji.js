const { parseEmoji, EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

module.exports = (emoji) => {
  let custom = parseEmoji(emoji);
  if (!custom.id) return "Este no es un emoji del servidor v�lido";

  let url = `https://cdn.discordapp.com/emojis/${custom.id}.${custom.animated ? "gif?v=1" : "png"}`;

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Info del Emoji" })
    .setDescription(
      `**Id:** ${custom.id}\n` + `**Nombre:** ${custom.name}\n` + `**Animado:** ${custom.animated ? "Si" : "No"}`
    )
    .setImage(url);

  return { embeds: [embed] };
};
