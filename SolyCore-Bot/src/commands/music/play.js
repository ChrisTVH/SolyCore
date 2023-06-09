const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const prettyMs = require("pretty-ms");
const { EMBED_COLORS, MUSIC } = require("@root/config");
const { SpotifyItemType } = require("@lavaclient/spotify");

const search_prefix = {
  YT: "ytsearch",
  YTM: "ytmsearch",
  SC: "scsearch",
};

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "play",
  description: "reproduce una canción de varias plataformas",
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
        description: "nombre o url de la canción",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const query = args.join(" ");
    const response = await play(message, query);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const query = interaction.options.getString("query");
    const response = await play(interaction, query);
    await interaction.followUp(response);
  },
};

/**
 * @param {import("discord.js").CommandInteraction|import("discord.js").Message} arg0
 * @param {string} query
 */
async function play({ member, guild, channel }, query) {
  if (!member.voice.channel) return "🚫 Primero tienes que unirte a un canal de voz";

  let player = guild.client.musicManager.getPlayer(guild.id);
  if (player && !guild.members.me.voice.channel) {
    player.disconnect();
    await guild.client.musicManager.destroyPlayer(guild.id);
  }

  if (player && member.voice.channel !== guild.members.me.voice.channel) {
    return "🚫 Debes estar en el mismo canal de voz que el mío";
  }

  let embed = new EmbedBuilder().setColor(EMBED_COLORS.BOT_EMBED);
  let tracks;
  let description = "";

  try {
    if (guild.client.musicManager.spotify.isSpotifyUrl(query)) {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        return "🚫 No se pueden reproducir canciones de Spotify. Póngase en contacto con el propietario del bot";
      }

      const item = await guild.client.musicManager.spotify.load(query);
      switch (item?.type) {
        case SpotifyItemType.Track: {
          const track = await item.resolveYoutubeTrack();
          tracks = [track];
          description = `[${track.info.title}](${track.info.uri})`;
          break;
        }

        case SpotifyItemType.Artist:
          tracks = await item.resolveYoutubeTracks();
          description = `Artista: [**${item.name}**](${query})`;
          break;

        case SpotifyItemType.Album:
          tracks = await item.resolveYoutubeTracks();
          description = `Álbum: [**${item.name}**](${query})`;
          break;

        case SpotifyItemType.Playlist:
          tracks = await item.resolveYoutubeTracks();
          description = `Lista de reproducción: [**${item.name}**](${query})`;
          break;

        default:
          return "🚫 Se ha producido un error al buscar la canción";
      }

      if (!tracks) guild.client.logger.debug({ query, item });
    } else {
      const res = await guild.client.musicManager.rest.loadTracks(
        /^https?:\/\//.test(query) ? query : `${search_prefix[MUSIC.DEFAULT_SOURCE]}:${query}`
      );
      switch (res.loadType) {
        case "LOAD_FAILED":
          guild.client.logger.error("Excepción de búsqueda", res.exception);
          return "🚫 Se ha producido un error durante la búsqueda";

        case "NO_MATCHES":
          return `No se han encontrado resultados que coincidan ${query}`;

        case "PLAYLIST_LOADED":
          tracks = res.tracks;
          description = res.playlistInfo.name;
          break;

        case "TRACK_LOADED":
        case "SEARCH_RESULT": {
          const [track] = res.tracks;
          tracks = [track];
          break;
        }

        default:
          guild.client.logger.debug("Tipo de carga desconocida", res);
          return "🚫 Se ha producido un error al buscar la canción";
      }

      if (!tracks) guild.client.logger.debug({ query, res });
    }
  } catch (error) {
    guild.client.logger.error("Excepción de búsqueda", typeof error === "object" ? JSON.stringify(error) : error);
    return "🚫 Se ha producido un error al buscar la canción";
  }

  if (!tracks) return "🚫 Se ha producido un error al buscar la canción";

  if (tracks.length === 1) {
    const track = tracks[0];
    if (!player?.playing && !player?.paused && !player?.queue.tracks.length) {
      embed.setAuthor({ name: "Pista añadida a la cola" });
    } else {
      const fields = [];
      embed
        .setAuthor({ name: "Pista añadida a la cola" })
        .setDescription(`[${track.info.title}](${track.info.uri})`)
        .setFooter({ text: `Solicitado por: ${member.user.tag}` });

      fields.push({
        name: "Duración de la canción",
        value: "`" + prettyMs(track.info.length, { colonNotation: true }) + "`",
        inline: true,
      });

      if (player?.queue?.tracks?.length > 0) {
        fields.push({
          name: "Posición en la cola",
          value: (player.queue.tracks.length + 1).toString(),
          inline: true,
        });
      }
      embed.addFields(fields);
    }
  } else {
    embed
      .setAuthor({ name: "Lista de reproducción añadida a la cola" })
      .setDescription(description)
      .addFields(
        {
          name: "En cola",
          value: `${tracks.length} canciones`,
          inline: true,
        },
        {
          name: "Duración de la lista de reproducción",
          value:
            "`" +
            prettyMs(
              tracks.map((t) => t.info.length).reduce((a, b) => a + b, 0),
              { colonNotation: true }
            ) +
            "`",
          inline: true,
        }
      )
      .setFooter({ text: `Solicitado por: ${member.user.tag}` });
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
