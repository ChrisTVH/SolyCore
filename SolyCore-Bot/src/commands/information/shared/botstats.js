const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@helpers/Utils");
const os = require("os");
const { stripIndent } = require("common-tags");

/**
 * @param {import('@structures/BotClient')} client
 */
module.exports = (client) => {
  // ESTADÍSTICAS
  const guilds = client.guilds.cache.size;
  const channels = client.channels.cache.size;
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);

  // CPU
  const platform = process.platform.replace(/win32/g, "Windows");
  const architecture = os.arch();
  const cores = os.cpus().length;
  const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`;

  // RAM
  const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
  const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`;

  const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`;

  let desc = "";
  desc += `❒ Servidores totales: ${guilds}\n`;
  desc += `❒ Usuarios totales: ${users}\n`;
  desc += `❒ Canales totales: ${channels}\n`;
  desc += `❒ Ping del Websocket: ${client.ws.ping} ms\n`;
  desc += "\n";

  const embed = new EmbedBuilder()
    .setTitle("Información sobre bots")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(desc)
    .addFields(
      {
        name: "CPU",
        value: stripIndent`
        ❯ **SO:** ${platform} [${architecture}]
        ❯ **Nucleos:** ${cores}
        ❯ **Uso:** ${cpuUsage}
        `,
        inline: true,
      },
      {
        name: "RAM del bot",
        value: stripIndent`
        ❯ **Usado:** ${botUsed}
        ❯ **Disponible:** ${botAvailable}
        ❯ **Uso:** ${botUsage}
        `,
        inline: true,
      },
      {
        name: "RAM general",
        value: stripIndent`
        ❯ **Usado:** ${overallUsed}
        ❯ **Disponible:** ${overallAvailable}
        ❯ **Uso:** ${overallUsage}
        `,
        inline: true,
      },
      {
        name: "Versión de Node Js",
        value: process.versions.node,
        inline: false,
      },
      {
        name: "Tiempo de actividad",
        value: "```" + timeformat(process.uptime()) + "```",
        inline: false,
      }
    );

  // Botones
  let components = [];
  components.push(new ButtonBuilder().setLabel("Enlace de invitación").setURL(client.getInvite()).setStyle(ButtonStyle.Link));

  if (SUPPORT_SERVER) {
    components.push(new ButtonBuilder().setLabel("Servidor de soporte").setURL(SUPPORT_SERVER).setStyle(ButtonStyle.Link));
  }

  if (DASHBOARD.enabled) {
    components.push(
      new ButtonBuilder().setLabel("Enlace al panel de control").setURL(DASHBOARD.baseURL).setStyle(ButtonStyle.Link)
    );
  }

  let buttonsRow = new ActionRowBuilder().addComponents(components);

  return { embeds: [embed], components: [buttonsRow] };
};
