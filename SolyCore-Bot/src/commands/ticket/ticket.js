const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
  ComponentType,
} = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { isTicketChannel, closeTicket, closeAllTickets } = require("@handlers/ticket");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ticket",
  description: "varios comandos de emisi�n de billetes",
  category: "TICKET",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "setup <#canal>",
        description: "iniciar la configuraci�n de un billete interactivo",
      },
      {
        trigger: "log <#canal>",
        description: "configurar canal de registro para tickets",
      },
      {
        trigger: "limit <n�mero>",
        description: "establecer el n�mero m�ximo de tickets abiertos simult�neamente",
      },
      {
        trigger: "close",
        description: "cerrar el ticket",
      },
      {
        trigger: "closeall",
        description: "cerrar todos los tickets abiertos",
      },
      {
        trigger: "add <usuarioId|rolId>",
        description: "a�adir usuario/rol al ticket",
      },
      {
        trigger: "remove <usuarioId|rolId>",
        description: "eliminar usuario/rol del ticket",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "setup",
        description: "configurar un nuevo mensaje de ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "el canal al que debe enviarse el mensaje de creaci�n de ticket",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "log",
        description: "configurar canal de registro para tickets",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "canal al que deben enviarse los registros de tickets",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "limit",
        description: "establecer el n�mero m�ximo de tickets abiertos simult�neamente",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "n�mero m�ximo de tickets",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "close",
        description: "cierra el ticket [s�lo se utiliza en el canal de tickets].",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "closeall",
        description: "cierra todos los tickets abiertos",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "add",
        description: "a�adir usuario al canal de tickets actual [s�lo se utiliza en el canal de tickets].",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user_id",
            description: "el id del usuario a a�adir",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "eliminar al usuario del canal de tickets [s�lo se utiliza en el canal de tickets].",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "que el usuario elimine",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    let response;

    // Configurac�n
    if (input === "setup") {
      if (!message.guild.members.me.permissions.has("ManageChannels")) {
        return message.safeReply("Me falta `Manejo de Canales` para crear canales de tickets");
      }
      const targetChannel = message.guild.findMatchingChannels(args[1])[0];
      if (!targetChannel) {
        return message.safeReply("No pude encontrar canal con ese nombre");
      }
      return ticketModalSetup(message, targetChannel, data.settings);
    }

    // registro de ticket
    else if (input === "log") {
      if (args.length < 2) return message.safeReply("Indique el canal al que deben enviarse los registros de tickets");
      const target = message.guild.findMatchingChannels(args[1]);
      if (target.length === 0) return message.safeReply("No se ha encontrado ning�n canal coincidente");
      response = await setupLogChannel(target[0], data.settings);
    }

    // Fijar l�mite
    else if (input === "limit") {
      if (args.length < 2) return message.safeReply("Indique un n�mero");
      const limit = args[1];
      if (isNaN(limit)) return message.safeReply("Por favor, introduzca un n�mero");
      response = await setupLimit(limit, data.settings);
    }

    // Cerrar ticket
    else if (input === "close") {
      response = await close(message, message.author);
      if (!response) return;
    }

    // Cerrar todas las entradas
    else if (input === "closeall") {
      let sent = await message.safeReply("Cierre de tickets ...");
      response = await closeAll(message, message.author);
      return sent.editable ? sent.edit(response) : message.channel.send(response);
    }

    // A�adir usuario al ticket
    else if (input === "add") {
      if (args.length < 2) return message.safeReply("Por favor, indique un usuario o rol para a�adir al ticket");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await addToTicket(message, inputId);
    }

    // Eliminar usuario del ticket
    else if (input === "remove") {
      if (args.length < 2) return message.safeReply("Por favor, indique un usuario o rol para eliminar");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await removeFromTicket(message, inputId);
    }

    // Entrada no v�lida
    else {
        return message.safeReply("Uso incorrecto de comandos");
    }

    if (response) await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    let response;

    // configuraci�n
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");

      if (!interaction.guild.members.me.permissions.has("ManageChannels")) {
        return interaction.followUp("Me falta `Manage Channels` para crear canales de tickets");
      }

      await interaction.deleteReply();
      return ticketModalSetup(interaction, channel, data.settings);
    }

    // Canal de registro
    else if (sub === "log") {
      const channel = interaction.options.getChannel("channel");
      response = await setupLogChannel(channel, data.settings);
    }

    // Limite
    else if (sub === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setupLimit(limit, data.settings);
    }

    // Cerrar
    else if (sub === "close") {
      response = await close(interaction, interaction.user);
    }

    // Cerrar todo
    else if (sub === "closeall") {
      response = await closeAll(interaction, interaction.user);
    }

    // A�ade a un tciket
    else if (sub === "add") {
      const inputId = interaction.options.getString("user_id");
      response = await addToTicket(interaction, inputId);
    }

    // Borrar de un ticket
    else if (sub === "remove") {
      const user = interaction.options.getUser("user");
      response = await removeFromTicket(interaction, user.id);
    }

    if (response) await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').Message} param0
 * @param {import('discord.js').GuildTextBasedChannel} targetChannel
 * @param {object} settings
 */
async function ticketModalSetup({ guild, channel, member }, targetChannel, settings) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_btnSetup").setLabel("Configuraci�n de mensaje").setStyle(ButtonStyle.Primary)
  );

  const sentMsg = await channel.safeSend({
    content: "Haga clic en el siguiente bot�n para configurar el mensaje de ticket",
    components: [buttonRow],
  });

  if (!sentMsg) return;

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.customId === "ticket_btnSetup" && i.member.id === member.id && i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch((ex) => {});

  if (!btnInteraction) return sentMsg.edit({ content: "No se recibe respuesta, se cancela la configuraci�n", components: [] });

  // modo de visualizaci�n
  await btnInteraction.showModal(
    new ModalBuilder({
      customId: "ticket-modalSetup",
      title: "Configuraci�n de tickets",
      components: [
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Titulo del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Descripci�n del embed")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Pie de p�gina del embed")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("staff")
            .setLabel("Roles de Staff")
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
      filter: (m) => m.customId === "ticket-modalSetup" && m.member.id === member.id && m.message.id === sentMsg.id,
    })
    .catch((ex) => {});

  if (!modal) return sentMsg.edit({ content: "No se recibe respuesta, se cancela la configuraci�n", components: [] });

  await modal.reply("Configurar mensaje de ticket ...");
  const title = modal.fields.getTextInputValue("title");
  const description = modal.fields.getTextInputValue("description");
  const footer = modal.fields.getTextInputValue("footer");
  const staffRoles = modal.fields
    .getTextInputValue("staff")
    .split(",")
    .filter((s) => guild.roles.cache.has(s.trim()));

  // send ticket message
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: title || "Ticket de soporte" })
    .setDescription(description || "Utilice el siguiente bot�n para crear un ticket")
    .setFooter({ text: footer || "S�lo puede tener 1 ticket abierto a la vez." });

  const tktBtnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Abrir un ticket").setCustomId("TICKET_CREATE").setStyle(ButtonStyle.Success)
  );

  // guardar configuraci�n
  settings.ticket.staff_roles = staffRoles;
  await settings.save();

  await targetChannel.send({ embeds: [embed], components: [tktBtnRow] });
  await modal.deleteReply();
  await sentMsg.edit({ content: "�Listo! Mensaje de ticket creado", components: [] });
}

async function setupLogChannel(target, settings) {
  if (!target.canSendEmbeds()) return `�Uy! No tengo permiso para enviar un embed a ${target}`;

  settings.ticket.log_channel = target.id;
  await settings.save();

  return `�Configuraci�n guardada! Los registros de tickets se enviar�n a ${target.toString()}`;
}

async function setupLimit(limit, settings) {
  if (Number.parseInt(limit, 10) < 5) return "El l�mite de tickets no puede ser inferior a 5";

  settings.ticket.limit = limit;
  await settings.save();

  return `Configuraci�n guardada. Ahora puede tener un m�ximo de \`${limit}\` tickets abiertos`;
}

async function close({ channel }, author) {
  if (!isTicketChannel(channel)) return "Este comando s�lo puede utilizarse en los canales de tickets";
  const status = await closeTicket(channel, author, "Cerrado por un moderador");
  if (status === "MISSING_PERMISSIONS") return "No tengo permiso para cerrar tickets";
  if (status === "ERROR") return "Se ha producido un error al cerrar el ticket";
  return null;
}

async function closeAll({ guild }, user) {
  const stats = await closeAllTickets(guild, user);
  return `�Completado! �xito: \`${stats[0]}\` Fallo: \`${stats[1]}\``;
}

async function addToTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Este comando s�lo puede utilizarse en el canal de tickets";
  if (!inputId || isNaN(inputId)) return "�Ups! Necesita introducir un usuarioId/rol-Id v�lido";

  try {
    await channel.permissionOverwrites.create(inputId, {
      ViewChannel: true,
      SendMessages: true,
    });

    return "Hecho";
  } catch (ex) {
    return "Error al a�adir usuarioId/rol-Id. �Ha proporcionado un ID v�lido?";
  }
}

async function removeFromTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Este comando s�lo puede utilizarse en el canal de tickets";
  if (!inputId || isNaN(inputId)) return "�Ups! Necesita introducir un usuarioId/rol-Id v�lido";

  try {
    channel.permissionOverwrites.create(inputId, {
      ViewChannel: false,
      SendMessages: false,
    });
    return "Hecho";
  } catch (ex) {
    return "No se ha podido eliminar el usuarioID/rol-Id. �Ha proporcionado un ID v�lido?";
  }
}
