const mongoose = require("mongoose");
const { log, success, error } = require("../helpers/Logger");

mongoose.set("strictQuery", true);

module.exports = {
  async initializeMongoose() {
    log(`Conectando a MongoDb...`);

    try {
      await mongoose.connect(process.env.MONGO_CONNECTION, {
        keepAlive: true,
      });

      success("Mongoose: Conexión de base de datos establecida");

      return mongoose.connection;
    } catch (err) {
      error("Mongoose: Fallo al conectar con la base de datos", err);
      process.exit(1);
    }
  },

  schemas: {
    Giveaways: require("./schemas/Giveaways"),
    Guild: require("./schemas/Guild"),
    Member: require("./schemas/Member"),
    ReactionRoles: require("./schemas/ReactionRoles").model,
    ModLog: require("./schemas/ModLog").model,
    TranslateLog: require("./schemas/TranslateLog").model,
    User: require("./schemas/User"),
    Suggestions: require("./schemas/Suggestions").model,
  },
};
