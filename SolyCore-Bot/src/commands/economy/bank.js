const { ApplicationCommandOptionType } = require("discord.js");
const balance = require("./sub/balance");
const deposit = require("./sub/deposit");
const transfer = require("./sub/transfer");
const withdraw = require("./sub/withdraw");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bank",
  description: "acceso a las operaciones bancarias",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "saldo",
        description: "consultar el saldo",
      },
      {
        trigger: "depósito <monedas>",
        description: "ingresar monedas en su cuenta bancaria",
      },
      {
        trigger: "retirar <monedas>",
        description: "retirar monedas de su cuenta bancaria",
      },
      {
        trigger: "transferencia <usuario> <monedas>",
        description: "transferir monedas a otro usuario",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "balance",
        description: "consultar el saldo de monedas",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "nombre del usuario",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: "deposit",
        description: "ingresar monedas en su cuenta bancaria",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "número de monedas a depositar",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "withdraw",
        description: "retirar monedas de su cuenta bancaria",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "número de monedas a retirar",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "transfer",
        description: "transferir monedas a otro usuario",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "el usuario al que deben transferirse las monedas",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "coins",
            description: "la cantidad de monedas a transferir",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0];
    let response;

    if (sub === "balance") {
      const resolved = (await message.guild.resolveMember(args[1])) || message.member;
      response = await balance(resolved.user);
    }

    //
    else if (sub === "deposit") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Indique un número válido de monedas que desea depositar");
      response = await deposit(message.author, coins);
    }

    //
    else if (sub === "withdraw") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Indique un número válido de monedas que desea retirar");
      response = await withdraw(message.author, coins);
    }

    //
    else if (sub === "transfer") {
      if (args.length < 3) return message.safeReply("Proporcionar un usuario válido y monedas para transferir");
      const target = await message.guild.resolveMember(args[1], true);
      if (!target) return message.safeReply("Proporcionar un usuario válido al que transferir monedas");
      const coins = parseInt(args[2]);
      if (isNaN(coins)) return message.safeReply("Indique un número válido de monedas que desea transferir");
      response = await transfer(message.author, target.user, coins);
    }

    //
    else {
      return message.safeReply("Utilización de comando no válida");
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // saldo
    if (sub === "balance") {
      const user = interaction.options.getUser("user") || interaction.user;
      response = await balance(user);
    }

    // deposito
    else if (sub === "deposit") {
      const coins = interaction.options.getInteger("coins");
      response = await deposit(interaction.user, coins);
    }

    // retirar
    else if (sub === "withdraw") {
      const coins = interaction.options.getInteger("coins");
      response = await withdraw(interaction.user, coins);
    }

    // transferir
    else if (sub === "transfer") {
      const user = interaction.options.getUser("user");
      const coins = interaction.options.getInteger("coins");
      response = await transfer(interaction.user, user, coins);
    }

    await interaction.followUp(response);
  },
};
