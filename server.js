import express from "express";
import cors from "cors";
import middleware from "./handlers/middleware.js";
import staticRouter from "./handlers/static.js";
import meta from "./handlers/meta.js";
import poster from "./handlers/poster.js";
import stream from "./handlers/stream.js";
import subtitles from "./handlers/subtitles.js";
import catalog from "./handlers/catalog.js";
import "dotenv/config";

const app = express();

app.use(cors());

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// read env once
const ANILIST_AUTH_URL =
  process.env.ANILIST_AUTH_URL || "https://anilist.co/404";

const BASE_URL =
  process.env.BASE_URL || "http://localhost:7000";

// simple template helper
function renderTemplate(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }

  return content;
}

/* -------------------------
   CONFIGURE PAGE (HTML)
------------------------- */
app.get("/configure", (req, res) => {
  const html = renderTemplate(
    path.join(__dirname, "public", "configure.html"),
    {
      ANILIST_AUTH_URL,
      BASE_URL,
    }
  );

  res.send(html);
});

/* -------------------------
   MANIFEST (JSON)
------------------------- */
app.get(["/manifest.json", "/:authCode/manifest.json"], (req, res) => {
  const json = renderTemplate(
    path.join(__dirname, "public", "manifest.json"),
    {
      BASE_URL,
    }
  );

  res.type("application/json").send(json);
});

/* -------------------------
   STATIC FILES (LAST)
------------------------- */
app.use(express.static("public"));
app.set("trust proxy", 1);

app.use(middleware);
app.use(staticRouter);
app.use(meta);
app.use(poster);
app.use(stream);
app.use(subtitles);
app.use(catalog);

const PORT = process.env.PORT || 7000;
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
    console.log(`AnilistStream running at http://${HOST}:${PORT}`);
    console.log(`Visit http://${HOST}:${PORT}/configure to set up your token.`);
});
