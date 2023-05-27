const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (self, target, coins) => {
  if (isNaN(coins) || coins <= 0) return "Por favor, introduce una cantidad válida de monedas para transferir";
  if (target.bot) return "No se pueden transferir monedas a los bots.";
  if (target.id === self.id) return "No se pueden transferir monedas a uno mismo.";

  const userDb = await getUser(self);

  if (userDb.bank < coins) {
    return `Saldo bancario insuficiente Sólo dispone de ${userDb.bank}${ECONOMY.CURRENCY} en su cuenta bancaria.${
      userDb.coins > 0 && "\nDebe depositar sus monedas en el banco antes de poder transferirlas"
    } `;
  }

  const targetDb = await getUser(target);

  userDb.bank -= coins;
  targetDb.bank += coins;

  await userDb.save();
  await targetDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "Saldo actualizado" })
    .setDescription(`Ha transferido correctamente ${coins}${ECONOMY.CURRENCY} a ${target.tag}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
