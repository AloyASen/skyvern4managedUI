import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();

app.use(cors());

app.get("/artifact/recording", (req, res) => {
  const range = req.headers.range;
  const path = req.query.path;

  if (!path) {
    return res.status(400).send("Missing 'path' query parameter");
  }

  let stat;
  try {
    stat = fs.statSync(path);
  } catch (e) {
    return res.status(404).send("File not found");
  }

  const videoSize = stat.size;
  const chunkSize = 1 * 1e6; // 1MB chunks

  // If no Range header, stream the whole file
  if (!range) {
    const headers = {
      "Content-Length": videoSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, headers);
    return fs.createReadStream(path).pipe(res);
  }

  const startNum = Number(String(range).replace(/\D/g, "")) || 0;
  const start = Math.max(0, startNum);
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  fs.createReadStream(path, { start, end }).pipe(res);
});

app.get("/artifact/image", (req, res) => {
  const path = req.query.path;
  if (!path) return res.status(400).send("Missing 'path' query parameter");
  res.sendFile(path, (err) => {
    if (err) res.status(err.statusCode || 404).end();
  });
});

app.get("/artifact/json", (req, res) => {
  const path = req.query.path;
  if (!path) return res.status(400).send("Missing 'path' query parameter");
  let contents;
  try {
    contents = fs.readFileSync(path, "utf8");
  } catch (e) {
    return res.status(404).send("File not found");
  }
  try {
    const data = JSON.parse(contents);
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/artifact/text", (req, res) => {
  const path = req.query.path;
  if (!path) return res.status(400).send("Missing 'path' query parameter");
  try {
    const contents = fs.readFileSync(path, "utf8");
    res.type("text/plain").send(contents);
  } catch (e) {
    res.status(404).send("File not found");
  }
});

app.listen(9090);
