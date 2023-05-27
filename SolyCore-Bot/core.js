require("dotenv").config();
require("module-alias/register");

// Ampliar registros
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { checkForUpdates } = require("@helpers/BotUtils");
const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

validateConfiguration();

// Inicializar cliente
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// Encontrar rechazos de promesas no gestionados
process.on("unhandledRejection", (err) => client.logger.error(`Excepción no controlada`, err));

(async () => {
    // Buscar actualizaciones
    await checkForUpdates();

    // Iniciar el dashboard
    if (client.config.DASHBOARD.enabled) {
        client.logger.log("Iniciar el dashboard");
        try {
            const { launch } = require("@root/dashboard/app");

            // Dejar que el dashboard inicialice la base de datos
            await launch(client);
        } catch (ex) {
            client.logger.error("Error al iniciar el dashboard", ex);
        }
    } else {
        // Inicializar la base de datos
        await initializeMongoose();
    }

    // Iniciar el cliente
    await client.login(process.env.BOT_TOKEN);
})();