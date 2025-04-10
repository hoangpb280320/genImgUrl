import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const domain = "https://genimgurl-production.up.railway.app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.post("/snapshot", async (req, res) => {
  const { mediaUrl, series } = req.body;

  if (!mediaUrl) {
    return res.status(400).json({ error: "Missing mediaUrl!" });
  }

  const outputDir = path.join(__dirname, "images");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const newSeries = [];

  await Promise.all(
    series.map((item) => {
      return new Promise((resolve, reject) => {
        const id = uuidv4();

        const outputPath = path.join(outputDir, `${id}.jpg`);
        const startTimeMs = item.startTimeMs;

        const command = `ffmpeg -ss ${
          startTimeMs / 1000
        } -i "${mediaUrl}" -frames:v 1 -q:v 2 "${outputPath}"`;

        exec(command, (err) => {
          if (err) {
            console.error("FFmpeg error:", err);
            return reject(err);
          }

          const imageUrl = `${domain}/images/${id}.jpg`;
          newSeries.push({
            ...item,
            imageUrl,
          });
          resolve();
        });
      });
    })
  );

  res.json({ mediaUrl, series: newSeries });
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/check", async (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Server working on ${domain}`);
});
