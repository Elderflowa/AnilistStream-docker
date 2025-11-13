const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  searchAnime,
  getAnimeDetails,
  getPlanningAnime,
  getWatchingAnime,
} = require("./src/anilist");
const {
  getAnimeStreams,
  updateUserWatchStatusOnAnilist,
  getSubtitlesUrl,
} = require("./src/addon");
const { getAnimeByAnilistId, getSubtitles } = require("./src/anicli");

const app = express();
app.use(cors());
app.use(express.static("public"));

// ------------------- MANIFEST -------------------
const manifest = {
  id: "community.AnilistStream",
  version: "0.0.2",
  catalogs: [
    {
      type: "series",
      id: "anilist",
      name: "Anime",
      extra: [
        {
          name: "search",
          isRequired: true,
        },
      ],
    },
    {
      type: "series",
      id: "anilist_watching",
      name: "Watching Now",
    },
    {
      type: "series",
      id: "anilist_planning",
      name: "Planning to Watch",
    },
  ],
  resources: [
    "catalog",
    {
      name: "meta",
      types: ["series"],
      idPrefixes: ["ani_"],
    },
    "stream",
    "subtitles",
  ],
  types: ["series", "movie"],
  name: "AnilistStream",
  description: "Streaming anime and Anilist sync",
  idPrefixes: ["ani_"],
  logo: "https://miraitv.stremio.edmit.in/logo.png",
  behaviorHints: {
    configurable: true,
    configurationRequired: false,
  },
  config: [
    {
      key: "anilist_access_token",
      type: "text",
      title:
        'Your Anilist access token. Get it by visiting <a href="https://anilist.co/api/v2/oauth/authorize?client_id=31463&response_type=token" target="_blank" rel="noopener noreferrer">Anilist OAuth Authorize</a> and copying the token from the Box.',
      required: true,
    },
  ],
};

// app.use((req, res, next) => {
//   const start = Date.now();

//   res.on("finish", () => {
//     const ms = Date.now() - start;
//     console.log(
//       `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${
//         res.statusCode
//       } (${ms}ms)`
//     );
//   });

//   next();
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/logo.png", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "logo.png"));
});

app.get("/configure", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "configure.html"));
});

app.get(
  ["/:anilistToken/configure", "/:anilistToken/configure.json"],
  (req, res) => {
    res.sendFile(path.join(__dirname, "public", "configure.html"));
  }
);

// ------------------- PATH-BASED ROUTES -------------------

// Manifest

app.get("/manifest.json", (req, res) => {
  res.setHeader("Cache-Control", "max-age=604800");
  res.setHeader("Content-Type", "application/json");
  res.json(manifest);
});

app.get("/:anilistToken/manifest.json", (req, res) => {
  res.setHeader("Cache-Control", "max-age=604800");
  res.setHeader("Content-Type", "application/json");
  res.json(manifest);
});

// Catalog

app.get("/catalog/:type/:id.json", async (req, res) => {
  try {
    const { type, id } = req.params;

    if (id === "anilist_planning") {
      return res.json({ metas: [] });
    } else if (id === "anilist_watching") {
      return res.json({ metas: [] });
    }
  } catch (err) {
    console.error("Catalog error:", err);
    res.status(500).json({ metas: [] });
  }
});

app.get("/:anilistToken/catalog/:type/:id.json", async (req, res) => {
  try {
    const { anilistToken, type, id } = req.params;

    if (id === "anilist_planning" && anilistToken) {
      const planningAnime = await getPlanningAnime(anilistToken);
      return res.json({ metas: planningAnime });
    } else if (id === "anilist_watching" && anilistToken) {
      const watchingAnime = await getWatchingAnime(anilistToken);
      return res.json({ metas: watchingAnime });
    }
  } catch (err) {
    console.error("Catalog error:", err);
    res.status(500).json({ metas: [] });
  }
});

app.get("/:anilistToken/catalog/:type/:id/:extra.json", async (req, res) => {
  try {
    const { anilistToken, type, id, extra } = req.params;

    if (id === "anilist_planning" && anilistToken) {
      const planningAnime = await getPlanningAnime(anilistToken);
      return res.json({ metas: planningAnime });
    }

    const searchQuery =
      extra && extra.startsWith("search=")
        ? decodeURIComponent(extra.split("=")[1])
        : "";
    const anime = await searchAnime(searchQuery, anilistToken);
    res.json({ metas: anime });
  } catch (err) {
    console.error("Catalog error:", err);
    res.status(500).json({ metas: [] });
  }
});

// Meta
app.get("/:anilistToken/meta/:type/:id.json", async (req, res) => {
  try {
    const { anilistToken, id } = req.params;
    const meta = await getAnimeDetails(id, anilistToken);
    res.json({ meta });
  } catch (err) {
    console.error("Meta error:", err);
    res.status(500).json({ meta: {} });
  }
});

app.get("/meta/:type/:id.json", async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await getAnimeDetails(id);
    res.json({ meta });
  } catch (err) {
    console.error("Meta error:", err);
    res.status(500).json({ meta: {} });
  }
});

// Stream
app.get("/:anilistToken/stream/:type/:id.json", async (req, res) => {
  try {
    const { anilistToken, id } = req.params;

    if (!id.startsWith("ani_")) return res.json({ streams: [] });

    const [_, animeId, titleRaw, episodeRaw] = id.split("_");
    const title = titleRaw?.replace(/[!?]/g, "");
    const episodeNumber = episodeRaw || 1;

    const streams = await getAnimeStreams(
      animeId,
      title,
      episodeNumber,
      anilistToken
    );

    // Update user's watch status on Anilist
    updateUserWatchStatusOnAnilist(
      anilistToken,
      animeId,
      episodeNumber,
      streams
    );

    res.json({ streams });
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).json({ streams: [] });
  }
});

app.get("/stream/:type/:id.json", async (req, res) => {
  try {
    const { anilistToken, id } = req.params;

    if (!id.startsWith("ani_")) return res.json({ streams: [] });

    const [_, animeId, titleRaw, episodeRaw] = id.split("_");
    const title = titleRaw?.replace(/[!?]/g, "");
    const episodeNumber = episodeRaw || 1;

    const streams = await getAnimeStreams(
      animeId,
      title,
      episodeNumber,
      anilistToken
    );

    res.json({ streams });
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).json({ streams: [] });
  }
});

// Subtitles
app.get(
  "/:anilistToken/subtitles/:type/:id/filename=:filename.json",
  async (req, res) => {
    try {
      const { id, filename } = req.params;

      if (!id.startsWith("ani_")) return res.json({ subtitles: [] });

      const allAnimeId = await getAnimeByAnilistId(
        id.split("_")[1],
        id.split("_")[2]
      );
      const subtitles = await getSubtitles(allAnimeId.id, id.split("_")[3]);

      if (!subtitles) return res.status(500).json({ subtitles: [] });

      return res.json({
        subtitles: [
          {
            id: "eng",
            lang: "English",
            url: subtitles,
          },
        ],
      });
    } catch (err) {
      console.error("Subtitles error:", err);
      return res.json({ subtitles: [] });
    }
  }
);

app.get("/subtitles/:type/:id/filename=:filename.json", async (req, res) => {
  try {
    const { id, filename } = req.params;

    if (!id.startsWith("ani_")) return res.json({ subtitles: [] });

    const allAnimeId = await getAnimeByAnilistId(
      id.split("_")[1],
      id.split("_")[2]
    );
    const subtitles = await getSubtitles(allAnimeId.id, id.split("_")[3]);

    if (!subtitles) return res.status(500).json({ subtitles: [] });

    return res.json({
      subtitles: [
        {
          id: "eng",
          lang: "English",
          url: subtitles,
        },
      ],
    });
  } catch (err) {
    console.error("Subtitles error", err);
    res.status(500).json;
  }
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 7000;
const HOST = "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`AnilistStream running at http://${HOST}:${PORT}`);
  console.log(`Visit http://${HOST}:${PORT}/configure to set up your token.`);
});
