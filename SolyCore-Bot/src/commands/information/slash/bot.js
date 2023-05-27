const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
} = require("discord.js");
const { timeformat } = require("@helpers/Utils");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config.js");
const botstats = require("../shared/botstats");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bot",
  description: "comandos relacionados con el bot",
  category: "INFORMATION",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "invite",
        description: "obtener invitación del bot",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "stats",
        description: "obtener estadísticas del bot",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "uptime",
        description: "obtener el tiempo de actividad del bot",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    if (!sub) return interaction.followUp("No es un subcomando válido");

    // Invitación
    if (sub === "invite") {
      const response = botInvite(interaction.client);
      try {
        await interaction.user.send(response);
        return interaction.followUp("¡Compruebe su DM para mi información! :envelope_with_arrow:");
      } catch (ex) {
        return interaction.followUp("No puedo enviarte mis datos. ¿Está abierto su DM?");
      }
    }

    // Estadísticas
    else if (sub === "stats") {
      const response = botstats(interaction.client);
      return interaction.followUp(response);
    }

    // Tiempo de actividad
    else if (sub === "uptime") {
      await interaction.followUp(`Mi tiempo de actividad: \`${timeformat(process.uptime())}\``);
    }
  },
};

function botInvite(client) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Invitación" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("Gracias por invitarme. Gracias por considerar invitarme\nUtiliza el botón de abajo para navegar donde quieras");

  // Botones
  let components = [];
  components.push(new ButtonBuilder().setLabel("Enlace de invitación").setURL(client.getInvite()).setStyle(ButtonStyle.Link));

  if (SUPPORT_SERVER) {
    components.push(new ButtonBuilder().setLabel("Servidor de asistencia").setURL(SUPPORT_SERVER).setStyle(ButtonStyle.Link));
  }

  if (DASHBOARD.enabled) {
    components.push(
      new ButtonBuilder().setLabel("Enlace al panel de control").setURL(DASHBOARD.baseURL).setStyle(ButtonStyle.Link)
    );
  }

  let buttonsRow = new ActionRowBuilder().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
}
