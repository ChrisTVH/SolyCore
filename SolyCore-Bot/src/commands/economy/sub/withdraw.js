const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

module.exports = async (user, coins) => {
  if (isNaN(coins) || coins <= 0) return "Introduzca una cantidad válida de monedas para depositar";
  const userDb = await getUser(user);

  if (coins > userDb.bank) return `Sólo tiene ${userDb.bank}${ECONOMY.CURRENCY} monedas en su banco`;

  userDb.bank -= coins;
  userDb.coins += coins;
  await userDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Nuevo saldo" })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: "Cartera",
        value: `${userDb.coins}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: "Banco",
        value: `${userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: "Patrimonio neto",
        value: `${userDb.coins + userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      }
    );

  return { embeds: [embed] };
};
