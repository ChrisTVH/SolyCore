require("dotenv").config();
const mongoose = require("mongoose");

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const warningMsg = `---------------
!!! ADVERTENCIA !!!
---------------
Este script migrará su base de datos de v4 a v5. Este script es todavía un trabajo en progreso e irreversible.
Por favor, asegúrese de tener una copia de seguridad de su base de datos antes de continuar.
¿Desea continuar? (y/n): `;

rl.question(warningMsg, async function (name) {
  try {
    if (name.toLowerCase() === "y") {
      console.log("?? Inicio de la migración (v4 a v5)");
      await migration();
      console.log("? Migración completada");
      process.exit(0);
    } else {
      console.log("Migración cancelada");
      process.exit(0);
    }
  } catch (ex) {
    console.log(ex);
    process.exit(1);
  }
});

async function migration() {
  // Connect to database
  await mongoose.connect(process.env.MONGO_CONNECTION, { keepAlive: true });
  console.log("?? Conexión a la base de datos establecida");

  // Get all collections
  const collections = await mongoose.connection.db.collections();
  console.log(`?? Colecciones encontradas ${collections.length}`);

  await migrateGuilds(collections);
  await migrateModLogs(collections);
  await migrateTranslateLogs(collections);
  await migrateSuggestions(collections);
  await migrateMemberStats(collections);
  await migrateMembers(collections);
  await migrateUsers(collections);
  await migrateMessages(collections);
}

const clearAndLog = (message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(message);
};

/**
 * Migrate mod-logs collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateGuilds = async (collections) => {
  process.stdout.write("?? Migración de la colección 'servidores' ");
  try {
    const guildsC = collections.find((c) => c.collectionName === "guilds");
    const toUpdate = await guildsC
      .find({
        $or: [
          { "data.owner": { $type: "object" } },
          { "automod.strikes": 5 },
          { "automod.action": "MUTE" },
          { "automod.anti_scam": { $exists: true } },
          { "max_warn.strikes": 5 },
          { ranking: { $exists: true } },
        ],
      })
      .toArray();

    if (toUpdate.length > 0) {
      for (const doc of toUpdate) {
        if (typeof doc.data.owner === "object") doc.data.owner = doc.data.owner.id;
        if (typeof doc.automod === "object") {
          if (doc.automod.strikes === 5) doc.automod.strikes = 10;
          if (doc.automod.action === "MUTE") doc.automod.action = "TIMEOUT";
          doc.automod.anti_spam = doc.automod.anti_scam || false;
        }
        if (typeof doc.max_warn === "object") {
          if (doc.max_warn.action === "MUTE") doc.automod.action = "TIMEOUT";
          if (doc.max_warn.action === "BAN") doc.automod.action = "KICK";
        }
        if (typeof doc.stats !== "object") doc.stats = {};
        if (doc.ranking?.enabled) doc.stats.enabled = true;
        await guildsC.updateOne({ _id: doc._id }, { $set: doc });

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `?? Migración de la colección de 'servidores' | Completado - ${Math.round(
            (toUpdate.indexOf(doc) / toUpdate.length) * 100
          )}%`
        );
      }

      await guildsC.updateMany(
        {},
        {
          $unset: {
            "automod.anti_scam": "",
            "automod.max_mentions": "",
            "automod.max_role_mentions": "",
            ranking: "",
          },
        }
      );

      clearAndLog(`?? Migración la colección 'servidores' | ? Actualizado: ${toUpdate.length}`);
    } else {
      clearAndLog("?? Migración de la colección 'servidores' | ? No se requieren actualizaciones.");
    }
  } catch (ex) {
    clearAndLog("?? Migración de colección de 'servidores' | ? Se ha producido un error.");
    console.log(ex);
  }
};

/**
 * Migrate mod-logs collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateModLogs = async (collections) => {
  process.stdout.write("?? Migración de la colección 'mod-logs' ");
  try {
    const modLogs = collections.find((c) => c.collectionName === "mod-logs");
    const stats = await modLogs.updateMany({}, { $unset: { expires: "" } });
    await modLogs.updateMany({ type: "MUTE" }, { $set: { type: "TIMEOUT" } });
    await modLogs.updateMany({ type: "UNMUTE" }, { $set: { type: "UNTIMEOUT" } });
    console.log(`| ? ${stats.modifiedCount > 0 ? `Actualizado: ${stats.modifiedCount}` : "No es necesario actualizar"}`);
  } catch (ex) {
    clearAndLog("?? Migración de la colección de 'mod-logs' | ? Se ha producido un error.");
    console.log(ex);
  }
};

/**
 * Migrate translate-logs collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateTranslateLogs = async (collections) => {
  process.stdout.write("?? Migración de la colección 'translate-logs' ");
  console.log("| ? No requiere actualizaciones");
};

/**
 * Migrate suggestions collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateSuggestions = async (collections) => {
  process.stdout.write("?? Migración de la colección 'suggestions' ");
  try {
    const suggestionsC = collections.find((c) => c.collectionName === "suggestions");

    const toUpdate = await suggestionsC
      .find({ $or: [{ channel_id: { $exists: false } }, { createdAt: { $exists: true } }] })
      .toArray();

    if (toUpdate.length > 0) {
      // cache all guilds
      const guilds = await collections
        .find((c) => c.collectionName === "guilds")
        .find({})
        .toArray();
      const cache = new Map();
      for (const guild of guilds) cache.set(guild._id, guild);

      for (const doc of toUpdate) {
        const guildDb = cache.get(doc.guild_id);
        await suggestionsC.updateOne(
          { _id: doc._id },
          {
            $set: { channel_id: guildDb.suggestions.channel_id },
            $rename: { createdAt: "created_at", updatedAt: "updated_at" },
          }
        );
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `?? Migración de colección de 'suggestions' | Completado - ${Math.round(
            (toUpdate.indexOf(doc) / toUpdate.length) * 100
          )}%`
        );
      }

      clearAndLog(`?? Migración de la colección de 'suggestions' | ? Actualizado: ${toUpdate.length}`);
    } else {
      clearAndLog("?? Migración de la colección 'suggestions' | ? No se requieren actualizaciones");
    }
  } catch (ex) {
    clearAndLog("?? Migración de la colección 'suggestions' | ? Se ha producido un error");
    console.log(ex);
  }
};

/**
 * Migrate member-stats collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateMemberStats = async (collections) => {
  process.stdout.write("?? Migración de la colección 'member-stats ");
  try {
    const membersC = collections.find((c) => c.collectionName === "members");
    if (!collections.find((c) => c.collectionName === "member-stats")) {
      const memberStatsC = await mongoose.connection.db.createCollection("member-stats");

      const toUpdate = await membersC
        .find({ $or: [{ xp: { $exists: true } }, { level: { $exists: true } }] })
        .toArray();
      if (toUpdate.length > 0) {
        for (const doc of toUpdate) {
          await memberStatsC.insertOne({
            guild_id: doc.guild_id,
            member_id: doc.member_id,
            xp: doc.xp,
            level: doc.level,
          });
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(
            `?? Migración de la colección 'member-stats' | Completado - ${Math.round(
              (toUpdate.indexOf(doc) / toUpdate.length) * 100
            )}%`
          );
        }

        clearAndLog(`?? Migración de la colección 'member-stats' | ? Actualizado: ${toUpdate.length}`);
      } else {
        clearAndLog("?? Migración de la colección 'member-stats' | ? No se requieren actualizaciones");
      }
    } else {
      clearAndLog("?? Migración de la colección 'member-stats' | ? No se requieren actualizaciones");
    }
  } catch (ex) {
    clearAndLog("?? Migración de la colección 'member-stats' | ? Se ha producido un error");
    console.log(ex);
  }
};

/**
 * Migrate members collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateMembers = async (collections) => {
  process.stdout.write("?? Migración de la colección 'members' ");
  try {
    const membersC = collections.find((c) => c.collectionName === "members");
    const toUpdate = await membersC.find({ $or: [{ xp: { $exists: true } }, { level: { $exists: true } }] }).toArray();
    if (toUpdate.length > 0) {
      const stats = await membersC.updateMany({}, { $unset: { xp: "", level: "", mute: "" } });
      clearAndLog(`?? Migrando colección 'members' | ? Actualizado: ${stats.modifiedCount}`);
    } else {
      clearAndLog("?? Migración de la colección 'members' | ? No se requieren actualizaciones");
    }
  } catch (ex) {
    clearAndLog("?? Migrando la colección 'members' | ? Se ha producido un error");
    console.log(ex);
  }
};

/**
 * Migrate users collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateUsers = async (collections) => {
  process.stdout.write("?? Migrando la colección 'users' ....");
  try {
    const usersC = collections.find((c) => c.collectionName === "users");

    const toUpdate = await usersC
      .find({ $or: [{ username: { $exists: false } }, { discriminator: { $exists: false } }] })
      .toArray();

    if (toUpdate.length > 0) {
      const { Client, GatewayIntentBits } = require("discord.js");
      const client = new Client({ intents: [GatewayIntentBits.Guilds] });
      await client.login(process.env.BOT_TOKEN);

      let success = 0,
        failed = 0;

      for (const doc of toUpdate) {
        try {
          const user = await client.users.fetch(doc._id);
          await usersC.updateOne(
            { _id: doc._id },
            { $set: { username: user.username, discriminator: user.discriminator } }
          );
          success++;
        } catch (e) {
          failed++;
        }

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `?? Migrando colección 'users' | Completado - ${Math.round(
            (toUpdate.indexOf(doc) / toUpdate.length) * 100
          )}%`
        );
      }

      clearAndLog(`?? Migrando colección 'users' | ? Actualizado: ${success} | ? Falló: ${failed}`);
    } else {
      clearAndLog("?? Migración de la colección 'users' | ? No se requieren actualizaciones");
    }
  } catch (ex) {
    clearAndLog("?? Migrando colección 'users' | ? Se ha producido un error.");
    console.log(ex);
  }
};

/**
 * Migrate messages collection from v4 to v5
 * @param {mongoose.Collection<mongoose.Document>[]} collections
 */
const migrateMessages = async (collections) => {
  process.stdout.write("?? Migración de la colección 'messages' ");
  try {
    if (
      !collections.find((c) => c.collectionName === "v4-ticket-backup") &&
      !collections.find((c) => c.collectionName === "reaction-roles") &&
      collections.find((c) => c.collectionName === "messages")
    ) {
      const rrolesC = await mongoose.connection.db.createCollection("reaction-roles");
      const ticketsC = await mongoose.connection.db.createCollection("v4-ticket-backup");
      const messagesC = collections.find((c) => c.collectionName === "messages");

      const rrToUpdate = await messagesC.find({ roles: { $exists: true, $ne: [] } }).toArray();
      const tToUpdate = await messagesC.find({ ticket: { $exists: true } }).toArray();

      if (rrToUpdate.length > 0 || tToUpdate.length > 0) {
        await rrolesC.insertMany(
          rrToUpdate.map((doc) => ({
            guild_id: doc.guild_id,
            channel_id: doc.channel_id,
            message_id: doc.message_id,
            roles: doc.roles,
          }))
        );

        await ticketsC.insertMany(
          tToUpdate.map((doc) => ({
            guild_id: doc.guild_id,
            channel_id: doc.channel_id,
            message_id: doc.message_id,
            ticket: doc.ticket,
          }))
        );

        await mongoose.connection.db.dropCollection("messages");

        clearAndLog(
          `?? Migrando colección 'messages' | Completado - Actualizado: ${rrToUpdate.length + tToUpdate.length}`
        );
      } else {
        await mongoose.connection.db.dropCollection("messages");
        clearAndLog("?? Migración de la colección 'messages' | ? No se requieren actualizaciones");
      }
    } else {
      clearAndLog("?? Migración de la colección 'messages' | ? No se requieren actualizaciones");
    }
  } catch (ex) {
    clearAndLog("?? Migrando colección 'messages' | ? Se ha producido un error");
    console.log(ex);
  }
};
