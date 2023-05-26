const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Invitación" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("Gracias por invitarme. Gracias por considerar invitarme\nUtiliza el botón de abajo para navegar donde quieras");

  // Botones
  let components = [];
  components.push(new ButtonBuilder().setLabel("Enlace de invitación").setURL(client.getInvite()).setStyle(ButtonStyle.Link));

  if (SUPPORT_SERVER) {
    components.push(new ButtonBuilder().setLabel("Servidor de soporte").setURL(SUPPORT_SERVER).setStyle(ButtonStyle.Link));
  }

  if (DASHBOARD.enabled) {
    components.push(
      new ButtonBuilder().setLabel("Enlace del panel de control").setURL(DASHBOARD.baseURL).setStyle(ButtonStyle.Link)
    );
  }

  let buttonsRow = new ActionRowBuilder().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
};
