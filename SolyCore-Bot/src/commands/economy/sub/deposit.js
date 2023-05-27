const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (user, coins) => {
  if (isNaN(coins) || coins <= 0) return "Introduzca una cantidad válida de monedas para depositar";
  const userDb = await getUser(user);

  if (coins > userDb.coins) return `Sólo tienes ${userDb.coins}${ECONOMY.CURRENCY} monedas en su cartera`;

  userDb.coins -= coins;
  userDb.bank += coins;
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
