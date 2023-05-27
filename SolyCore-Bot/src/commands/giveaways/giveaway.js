const {
  ChannelType,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} = require("discord.js");
const { parsePermissions } = require("@helpers/Utils");
const ems = require("enhanced-ms");

// Sub Commands
const start = require("./sub/start");
const pause = require("./sub/pause");
const resume = require("./sub/resume");
const end = require("./sub/end");
const reroll = require("./sub/reroll");
const list = require("./sub/list");
const edit = require("./sub/edit");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "giveaway",
  description: "comandos de sorteos",
  category: "GIVEAWAY",
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "empezar <#canal>",
        description: "ccrear un nuevo sorteo",
      },
      {
        trigger: "pausar <mensajeId>",
        description: "pausar un sorteo",
      },
      {
        trigger: "reanudar <mensajeId>",
        description: "reanudar un sorteo en pausa",
      },
      {
        trigger: "finalizar <mensajeId>",
        description: "finalizar un sorteo",
      },
      {
        trigger: "volver a tirar <mensajeId>",
        description: "volver a hacer un sorteo",
      },
      {
        trigger: "lista",
        description: "lista de todos los sorteos",
      },
      {
        trigger: "editar <mensajeId>",
        description: "editar un sorteo",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "start",
        description: "empezar un sorteo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "el canal en el que se empezará el sorteo",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "pause",
        description: "pausar sorteo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "La Id del mensaje del sorteo",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "resume",
        description: "reanudar un sorteo en pausa",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "el identificador de mensaje del sorteo",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "end",
        description: "finalizar un sorteo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "el identificador de mensaje del sorteo",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "reroll",
        description: "volver a tirar un sorteo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "el identificador de mensaje del sorteo",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "list",
        description: "lista de todos los sorteos",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "edit",
        description: "editar un sorteo",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "message_id",
            description: "el id del mensaje del sorteo",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "add_duration",
            description: "el número de minutos que hay que añadir a la duración del sorteo",
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
          {
            name: "new_prize",
            description: "el nuevo premio",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
          {
            name: "new_winners",
            description: "el nuevo número de ganadores",
            type: ApplicationCommandOptionType.Integer,
            required: false,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0]?.toLowerCase();
    let response;

    //
    if (sub === "start") {
      if (!args[1]) return message.safeReply("¡Uso incorrecto! Por favor, proporcione un canal para iniciar el sorteo en");
      const match = message.guild.findMatchingChannels(args[1]);
      if (!match.length) return message.safeReply(`No se ha encontrado ningún canal que coincida ${args[1]}`);
      return await runModalSetup(message, match[0]);
    }

    //
    else if (sub === "pause") {
      const messageId = args[1];
      response = await pause(message.member, messageId);
    }

    //
    else if (sub === "resume") {
      const messageId = args[1];
      response = await resume(message.member, messageId);
    }

    //
    else if (sub === "end") {
      const messageId = args[1];
      response = await end(message.member, messageId);
    }

    //
    else if (sub === "reroll") {
      const messageId = args[1];
      response = await reroll(message.member, messageId);
    }

    //
    else if (sub === "list") {
      response = await list(message.member);
    }

    //
    else if (sub === "edit") {
      const messageId = args[1];
      if (!messageId) return message.safeReply("Uso incorrecto Por favor proporcione un id de mensaje");
      return await runModalEdit(message, messageId);
    }

    //
    else response = "No es un subcomando válido";

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    //
    if (sub === "start") {
      const channel = interaction.options.getChannel("channel");
      return await runModalSetup(interaction, channel);
    }

    //
    else if (sub === "pause") {
      const messageId = interaction.options.getString("message_id");
      response = await pause(interaction.member, messageId);
    }

    //
    else if (sub === "resume") {
      const messageId = interaction.options.getString("message_id");
      response = await resume(interaction.member, messageId);
    }

    //
    else if (sub === "end") {
      const messageId = interaction.options.getString("message_id");
      response = await end(interaction.member, messageId);
    }

    //
    else if (sub === "reroll") {
      const messageId = interaction.options.getString("message_id");
      response = await reroll(interaction.member, messageId);
    }

    //
    else if (sub === "list") {
      response = await list(interaction.member);
    }

    //
    else if (sub === "edit") {
      const messageId = interaction.options.getString("message_id");
      const addDur = interaction.options.getInteger("add_duration");
      const addDurationMs = addDur ? ems(addDur) : null;
      if (!addDurationMs) {
        return interaction.followUp("Duración no válida");
      }
      const newPrize = interaction.options.getString("new_prize");
      const newWinnerCount = interaction.options.getInteger("new_winners");
      response = await edit(interaction.member, messageId, addDurationMs, newPrize, newWinnerCount);
    }

    //
    else response = "Subcomando no válido";

    await interaction.followUp(response);
  },
};

// Configuración Modelo de sorteo
/**
 * @param {import('discord.js').Message|import('discord.js').CommandInteraction} args0
 * @param {import('discord.js').GuildTextBasedChannel} targetCh
 */
async function runModalSetup({ member, channel, guild }, targetCh) {
  const SETUP_PERMS = ["ViewChannel", "SendMessages", "EmbedLinks"];

  // validar los permisos del canal
  if (!targetCh) return channel.safeSend("La configuración del sorteo ha sido cancelada. No ha mencionado un canal");
  if (!targetCh.type === ChannelType.GuildText && !targetCh.permissionsFor(guild.members.me).has(SETUP_PERMS)) {
    return channel.safeSend(
      `Se ha cancelado la preparación del sorteo.\nYo necesito ${parsePermissions(SETUP_PERMS)} en ${targetCh}`
    );
  }

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("giveaway_btnSetup").setLabel("Configuración de Sorteo").setStyle(ButtonStyle.Primary)
  );

  const sentMsg = await channel.safeSend({
    content: "Haga clic en el siguiente botón para configurar un nuevo sorteo",
    components: [buttonRow],
  });

  if (!sentMsg) return;

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "giveaway_btnSetup" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => {});

  if (!btnInteraction) return sentMsg.edit({ content: "No se recibe respuesta, se cancela la configuración", components: [] });

  // display modal
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "giveaway-modalSetup",
      title: "Configuración del sorteo",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("duration")
            .setLabel("¿Cuál es la duración?")
            .setPlaceholder("1h / 1d / 1w")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("prize")
            .setLabel("¿Cuál es el premio?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("winners")
                .setLabel("¿Número de ganadores?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("roles")
                .setLabel("Rol-Id que pueden participar en el sorteo")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("host")
            .setLabel("Id de usuario que organiza el sorteo")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );

  // receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: (m) => m.customId === "giveaway-modalSetup" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => {});

  if (!modal) return sentMsg.edit({ content: "No se recibe respuesta, se cancela la configuración", components: [] });

  sentMsg.delete().catch(() => {});
  await modal.reply("Organizar el sorteo...");

  // duración
  const duration = ems(modal.fields.getTextInputValue("duration"));
  if (isNaN(duration)) return modal.editReply("Se ha cancelado la instalación. No ha especificado una duración válida");

  // premiuo
  const prize = modal.fields.getTextInputValue("prize");

  // contador de ganadores
  const winners = parseInt(modal.fields.getTextInputValue("winners"));
  if (isNaN(winners)) return modal.editReply("La configuración se ha cancelado. No ha especificado un recuento de ganadores válido");

  // roles
  const allowedRoles =
    modal.fields
      .getTextInputValue("roles")
      ?.split(",")
      ?.filter((roleId) => guild.roles.cache.get(roleId.trim())) || [];

  // anfitrión
  const hostId = modal.fields.getTextInputValue("host");
  let host = null;
  if (hostId) {
    try {
      host = await guild.client.users.fetch(hostId);
    } catch (ex) {
      return modal.editReply("La instalación se ha cancelado. Debe proporcionar un ID de usuario válido para el anfitrión");
    }
  }

  const response = await start(member, targetCh, duration, prize, winners, host, allowedRoles);
  await modal.editReply(response);
}

// Actualización del sorteo interactivo
/**
 * @param {import('discord.js').Message} message
 * @param {string} messageId
 */
async function runModalEdit(message, messageId) {
  const { member, channel } = message;

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("giveaway_btnEdit").setLabel("Editar sorteo").setStyle(ButtonStyle.Primary)
  );

  const sentMsg = await channel.send({
    content: "Haga clic en el botón de abajo para editar el sorteo",
    components: [buttonRow],
  });

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "giveaway_btnEdit" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => {});

  if (!btnInteraction) return sentMsg.edit({ content: "No se ha recibido respuesta, se cancela la actualización", components: [] });

  // modo de visualización
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "giveaway-modalEdit",
      title: "Actualización del sorteo",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("duration")
            .setLabel("Duración a añadir")
            .setPlaceholder("1h / 1d / 1se")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("prize")
            .setLabel("¿Cuál es el nuevo premio?")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("winners")
            .setLabel("¿Número de ganadores?")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  );

  // recibir entrada modal
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: (m) => m.customId === "giveaway-modalEdit" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => {});

  if (!modal) return sentMsg.edit({ content: "No se ha recibido respuesta, se cancela la actualización", components: [] });

  sentMsg.delete().catch(() => {});
  await modal.reply("Actualizando el sorteo...");

  // duración
  const addDuration = ems(modal.fields.getTextInputValue("duration"));
  if (isNaN(addDuration)) return modal.editReply("Se ha cancelado la actualización. No ha especificado una duración válida de la adición");

  // premios
  const newPrize = modal.fields.getTextInputValue("prize");

  // contador de ganadores
  const newWinnerCount = parseInt(modal.fields.getTextInputValue("winners"));
  if (isNaN(newWinnerCount)) {
    return modal.editReply("La actualización ha sido cancelada. No ha especificado un recuento de ganadores válido");
  }

  const response = await edit(message.member, messageId, addDuration, newPrize, newWinnerCount);
  await modal.editReply(response);
}
