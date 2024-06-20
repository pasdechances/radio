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

let clients = [];

const streamFile = () => {
  if (currentIndex >= audioFiles.length) {
    currentIndex = 0; // Restart playlist
  }
  const filePath = path.join(audioDir, audioFiles[currentIndex]);
  currentIndex++;

  const command = ffmpeg(filePath)
    .audioCodec('libmp3lame')
    .format('mp3');

  command.on('end', () => {
    // Delay before playing the next file
    setTimeout(streamFile, 100); // Adjust the delay as needed
  });

  command.on('error', err => {
    console.error(`Error streaming file: ${err.message}`);
    // Skip the problematic file
    streamFile();
  });

  command.on('data', chunk => {
    // Broadcast audio chunk to all connected clients
    clients.forEach(client => {
      client.emit('audio', chunk);
    });
  });

  command.pipe();
};

io.on('connection', (socket) => {
  console.log('New client connected');
  clients.push(socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clients = clients.filter(client => client !== socket);
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
