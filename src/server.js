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

io.on('connection', (socket) => {
  console.log('New client connected');

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
        return;
      }
      io.emit("audioMessage", `/${audioFileName}`);
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
        return;
      }
      io.emit("videoMessage", `/${videoFileName}`);
    });
  });

  socket.on('fileNote', (fileData) => {
    console.log("Received file note");
    const fileBuffer = Buffer.from(fileData.data, "base64");
    const fileName = `file-${Date.now()}-${fileData.name}`;
    const filePath = path.join(__dirname, "public", fileName);

    fs.writeFile(filePath, fileBuffer, (err) => {
      if (err) {
        console.error("Error saving file:", err);
        return;
      }
      io.emit("fileMessage", { name: fileData.name, url: `/${fileName}` });
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});