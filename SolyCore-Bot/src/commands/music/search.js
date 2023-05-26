const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ApplicationCommandOptionType,
  ComponentType,
} = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS, MUSIC } = require("@root/config");

const search_prefix = {
  YT: "ytsearch",
  YTM: "ytmsearch",
  SC: "scsearch",
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "search",
  description: "buscar canciones coincidentes en youtube",
  category: "MUSIC",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<nombre-de-la-canción>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "query",
        description: "canción a buscar",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const query = args.join(" ");
    const response = await search(message, query);
    if (response) await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await search(interaction, query);
    if (response) await interaction.followUp(response);
    else interaction.deleteReply();
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {string} query
 */
async function search({ member, guild, channel }, query) {
  if (!member.voice.channel) return "🚫 Primero tienes que unirte a un canal de voz";

  let player = guild.client.musicManager.getPlayer(guild.id);
  if (player && !guild.members.me.voice.channel) {
    player.disconnect();
    await guild.client.musicManager.destroyPlayer(guild.id);
  }
  if (player && member.voice.channel !== guild.members.me.voice.channel) {
    return "🚫 Debes estar en el mismo canal de voz que el mío";
  }

  let res;
  try {
    res = await guild.client.musicManager.rest.loadTracks(
      /^https?:\/\//.test(query) ? query : `${search_prefix[MUSIC.DEFAULT_SOURCE]}:${query}`
    );
  } catch (err) {
    return "🚫 Se ha producido un error durante la búsqueda";
  }

  let embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED);
  let tracks;

  switch (res.loadType) {
    case "LOAD_FAILED":
      guild.client.logger.error("Search Exception", res.exception);
      return "🚫 Se ha producido un error durante la búsqueda";

    case "NO_MATCHES":
      return `No se han encontrado resultados que coincidan ${query}`;

    case "TRACK_LOADED": {
      const [track] = res.tracks;
      tracks = [track];
      if (!player?.playing && !player?.paused && !player?.queue.tracks.length) {
        embed.setAuthor({ name: "Canción añadida a la cola" });
        break;
      }

      const fields = [];
      embed
        .setAuthor({ name: "Canción añadida a la cola" })
        .setDescription(`[${track.info.title}](${track.info.uri})`)
        .setFooter({ text: `Solicitado por: ${member.user.tag}` });

      fields.push({
        name: "Duración de la canción",
        value: "`" + prettyMs(track.info.length, { colonNotation: true }) + "`",
        inline: true,
      });

      // if (typeof track.displayThumbnail === "function") embed.setThumbnail(track.displayThumbnail("hqdefault"));
      if (player?.queue?.tracks?.length > 0) {
        fields.push({
          name: "Posición en la cola",
          value: (player.queue.tracks.length + 1).toString(),
          inline: true,
        });
      }
      embed.addFields(fields);
      break;
    }

    case "PLAYLIST_LOADED":
      tracks = res.tracks;
      embed
        .setAuthor({ name: "Lista de reproducción añadida a la cola" })
        .setDescription(res.playlistInfo.name)
        .addFields(
          {
            name: "En cola",
            value: `${res.tracks.length} canciones`,
            inline: true,
          },
          {
            name: "Duración de la lista de reproducción",
            value:
              "`" +
              prettyMs(
                res.tracks.map((t) => t.info.length).reduce((a, b) => a + b, 0),
                { colonNotation: true }
              ) +
              "`",
            inline: true,
          }
        )
        .setFooter({ text: `Solicitado por: ${member.user.tag}` });
      break;

    case "SEARCH_RESULT": {
      let max = guild.client.config.MUSIC.MAX_SEARCH_RESULTS;
      if (res.tracks.length < max) max = res.tracks.length;

      const results = res.tracks.slice(0, max);
      const options = results.map((result, index) => ({
        label: result.info.title,
        value: index.toString(),
      }));

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("search-results")
          .setPlaceholder("Elegir resultados de búsqueda")
          .setMaxValues(max)
          .addOptions(options)
      );

      const tempEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setAuthor({ name: "Resultados de la búsqueda" })
        .setDescription(`Seleccione las canciones que desea añadir a la cola`);

      const sentMsg = await channel.send({
        embeds: [tempEmbed],
        components: [menuRow],
      });

      try {
        const response = await channel.awaitMessageComponent({
          filter: (reactor) => reactor.message.id === sentMsg.id && reactor.user.id === member.id,
          idle: 30 * 1000,
          componentType: ComponentType.StringSelect,
        });

        await sentMsg.delete();
        if (!response) return "🚫 Has tardado demasiado en seleccionar las canciones";

        if (response.customId !== "search-results") return;
        const toAdd = [];
        response.values.forEach((v) => toAdd.push(results[v]));

        // Sólo se selecciona 1 canción
        if (toAdd.length === 1) {
          tracks = [toAdd[0]];
          embed.setAuthor({ name: "Canción añadida a la cola" });
        } else {
          tracks = toAdd;
          embed
            .setDescription(`🎶 Añadidas ${toAdd.length} canciones a la cola.`)
            .setFooter({ text: `Solicitado por: ${member.user.tag}` });
        }
      } catch (err) {
        console.log(err);
        await sentMsg.delete();
        return "🚫 No se ha podido registrar su respuesta";
      }
    }
  }

  // crear un reproductor y/o unirse al vc del miembro
  if (!player?.connected) {
    player = guild.client.musicManager.createPlayer(guild.id);
    player.queue.data.channel = channel;
    player.connect(member.voice.channel.id, { deafened: true });
  }

  // hacer colas
  const started = player.playing || player.paused;
  player.queue.add(tracks, { requester: member.user.tag, next: false });
  if (!started) {
    await player.queue.start();
  }

  return { embeds: [embed] };
}
