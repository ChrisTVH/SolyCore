const { translationHandler, reactionRoleHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");
const { isValidEmoji } = require("country-emoji-languages");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').MessageReaction|import('discord.js').PartialMessageReaction} reaction
 * @param {import('discord.js').User|import('discord.js').PartialUser} user
 */
module.exports = async (client, reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (ex) {
      return; // No se ha podido recuperar el mensaje (puede que se haya borrado)
    }
  }
  if (user.partial) await user.fetch();
  const { message, emoji } = reaction;
  if (user.bot) return;

  // Funciones de reacción
  reactionRoleHandler.handleReactionAdd(reaction, user);

  // Emojis de reacción
  if (!emoji.id) {
    // Traducción por banderas
    if (message.content && (await getSettings(message.guild)).flag_translation.enabled) {
      if (isValidEmoji(emoji.name)) {
        translationHandler.handleFlagReaction(emoji.name, message, user);
      }
    }
  }
};
