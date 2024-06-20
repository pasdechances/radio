const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const audioDir = path.join(__dirname, 'audio');

let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));

const streamFile = () => {
  console.log("nbfiles", audioFiles.length)
  console.log("cureentI", currentIndex)
  if (currentIndex >= audioFiles.length) {
    currentIndex = 0;
  }
  const filePath = path.join(audioDir, audioFiles[currentIndex]);
  currentIndex++;

  const command = ffmpeg(filePath)
    .audioCodec('libmp3lame')
    .format('mp3')
    .on('end', () => {
      setTimeout(streamFile, 100);
    })
    .on('error', err => {
      console.error(`Error streaming file: ${err.message}`);
      streamFile();
    });

  const ffmpegStream = command.pipe();
  
  ffmpegStream.on('data', chunk => {
    //console.log('on air');
    io.emit('audio', chunk);
  });

  ffmpegStream.on('end', () => {
    console.log('Stream ended');
    streamFile();
  });

  ffmpegStream.on('error', err => {
    console.error(`Stream error: ${err.message}`);
    streamFile();
  });
};

io.on('connection', (socket) => {
  console.log('New client connected to lobby');

  socket.on('userMessage', (msg) => {
    console.log(msg);
    io.emit('serverMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/radio', (req, res) => {
  res.send('Web radio is running, connect via WebSocket to receive the audio stream.');
});

app.get('/lecteur', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(port, () => {
  console.log(`Web radio server running at http://localhost:${port}`);
  streamFile();
});
