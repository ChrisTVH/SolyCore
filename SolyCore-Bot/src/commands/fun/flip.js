const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");

const NORMAL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_,;.?!/\\'0123456789";
const FLIPPED = "∀qϽᗡƎℲƃHIſʞ˥WNOԀὉᴚS⊥∩ΛMXʎZɐqɔpǝɟbɥıظʞןɯuodbɹsʇnʌʍxʎz‾'؛˙¿¡/\\,0ƖᄅƐㄣϛ9ㄥ86";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "flip",
  description: "lanza una moneda al aire o un mensaje",
  category: "FUN",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "coin",
        description: "lanza una moneda a cara o cruz",
      },
      {
        trigger: "texto <entrada>",
        description: "invierte el mensaje dado",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "coin",
            description: "lanzar una moneda",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "text",
        description: "invierte el mensaje dado",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "input",
            description: "texto para voltear",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if (sub === "coin") {
      const items = ["Corona", "Estrella"];
      const toss = items[Math.floor(Math.random() * items.length)];

      message.channel.send({ embeds: [firstEmbed(message.author)] }).then((coin) => {
        // 2do embed
        setTimeout(() => {
          coin.edit({ embeds: [secondEmbed()] }).catch(() => {});
          // 3ro embed
          setTimeout(() => {
            coin.edit({ embeds: [resultEmbed(toss)] }).catch(() => {});
          }, 2000);
        }, 2000);
      });
    }

    //
    else if (sub === "text") {
      if (args.length < 2) return message.channel.send("Introduzca un texto");
      const input = args.join(" ");
      const response = await flipText(input);
      await message.safeReply(response);
    }

    // else
    else await message.safeReply("Uso incorrecto de comandos");
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand("type");

    if (sub === "coin") {
      const items = ["Corona", "Estrella"];
      const toss = items[Math.floor(Math.random() * items.length)];
      await interaction.followUp({ embeds: [firstEmbed(interaction.user)] });

      setTimeout(() => {
        interaction.editReply({ embeds: [secondEmbed()] }).catch(() => {});
        setTimeout(() => {
          interaction.editReply({ embeds: [resultEmbed(toss)] }).catch(() => {});
        }, 2000);
      }, 2000);
    }

    //
    else if (sub === "text") {
      const input = interaction.options.getString("input");
      const response = await flipText(input);
      await interaction.followUp(response);
    }
  },
};

const firstEmbed = (user) =>
  new EmbedBuilder().setColor(EMBED_COLORS.TRANSPARENT).setDescription(`${user.username}, comenzó el lanzamiento de la moneda`);

const secondEmbed = () => new EmbedBuilder().setDescription("¡La moneda está en el aire!");

const resultEmbed = (toss) =>
  new EmbedBuilder()
    .setDescription(`>> **Ha salido la ${toss}** <<`)
    .setImage(toss === "Corona" ? "https://cdn.discordapp.com/attachments/1038077615275266108/1111701932822761644/coin1.png" : "https://cdn.discordapp.com/attachments/1038077615275266108/1111701955987902534/coin2.png");

async function flipText(text) {
  let builder = "";
  for (let i = 0; i < text.length; i += 1) {
    const letter = text.charAt(i);
    const a = NORMAL.indexOf(letter);
    builder += a !== -1 ? FLIPPED.charAt(a) : letter;
  }
  return builder;
}
