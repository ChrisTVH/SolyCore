const mongoose = require("mongoose");

const reqString = {
  type: String,
  required: true,
};

const Schema = new mongoose.Schema(
  {
    guild_id: reqString,
    channel_id: reqString,
    message_id: reqString,
    roles: [
      {
        _id: false,
        emote: reqString,
        role_id: reqString,
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

const Model = mongoose.model("reaction-roles", Schema);

// Cache
const rrCache = new Map();
const getKey = (guildId, channelId, messageId) => `${guildId}|${channelId}|${messageId}`;

module.exports = {
  model: Model,

  cacheReactionRoles: async (client) => {
    // borrar caché anterior
    rrCache.clear();

    // cargar todos los documentos de la base de datos
    const docs = await Model.find().lean();

    // validar y almacenar en caché los documentos
    for (const doc of docs) {
      const guild = client.guilds.cache.get(doc.guild_id);
      if (!guild) {
        // await Model.deleteMany({ guild_id: doc.guild_id });
        continue;
      }
      if (!guild.channels.cache.has(doc.channel_id)) {
        // await Model.deleteMany({ guild_id: doc.guild_id, channel_id: doc.channel_id });
        continue;
      }
      const key = getKey(doc.guild_id, doc.channel_id, doc.message_id);
      rrCache.set(key, doc.roles);
    }
  },

  getReactionRoles: (guildId, channelId, messageId) => rrCache.get(getKey(guildId, channelId, messageId)) || [],

  addReactionRole: async (guildId, channelId, messageId, emote, roleId) => {
    const filter = { guild_id: guildId, channel_id: channelId, message_id: messageId };

    // Tire si la configuración existente está presente
    await Model.updateOne(filter, { $pull: { roles: { emote } } });

    const data = await Model.findOneAndUpdate(
      filter,
      {
        $push: {
          roles: { emote, role_id: roleId },
        },
      },
      { upsert: true, new: true }
    ).lean();

    // actualizar caché
    const key = getKey(guildId, channelId, messageId);
    rrCache.set(key, data.roles);
  },

  removeReactionRole: async (guildId, channelId, messageId) => {
    await Model.deleteOne({
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
    });
    rrCache.delete(getKey(guildId, channelId, messageId));
  },
};
