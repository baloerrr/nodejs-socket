const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3211;
const ejs = require("ejs");

app.engine("ejs", ejs.renderFile);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json({ limit: '50mb' }));

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("message", "Welcome to the chat!");

  socket.on("chatMessage", async (content) => {
    try {
      io.emit("message", content);
    } catch (error) {
      console.error("Error saving message:", error.message);
    }
  });

  socket.on("voiceNote", (base64String) => {
    console.log("Received voice note");
    const audioBuffer = Buffer.from(base64String, "base64");
    const audioFileName = `audio-${Date.now()}.wav`;
    const audioFilePath = path.join(__dirname, "public", audioFileName);

    fs.writeFile(audioFilePath, audioBuffer, (err) => {
      if (err) {
        console.error("Error saving audio:", err);
        socket.emit("message", "Failed to save audio note.");
        return;
      }
      // Mengirim pesan hanya ke client yang mengirimkan voice note
      socket.emit("audioMessage", `/${audioFileName}`);
    });
  });

  socket.on("videoNote", (base64String) => {
    console.log("Received video note");
    const videoBuffer = Buffer.from(base64String, "base64");
    const videoFileName = `video-${Date.now()}.webm`;
    const videoFilePath = path.join(__dirname, "public", videoFileName);

    fs.writeFile(videoFilePath, videoBuffer, (err) => {
      if (err) {
        console.error("Error saving video:", err);
        socket.emit("message", "Failed to save video note.");
        return;
      }
      // Mengirim pesan hanya ke client yang mengirimkan video note
      socket.emit("videoMessage", `/${videoFileName}`);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
