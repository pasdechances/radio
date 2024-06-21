const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const audioDir = path.join(__dirname, 'audio');

let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));

const streamFile = () => {
  if (currentIndex >= audioFiles.length) {
    currentIndex = 0;
  }
  const filePath = path.join(audioDir, audioFiles[currentIndex]);
  currentIndex++;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-segments-'));
  const segmentPattern = path.join(tempDir, 'segment-%03d.mp3');

  ffmpeg(filePath)
    .audioCodec('libmp3lame')
    .outputOptions([
      '-f segment',
      '-segment_time 1',
      '-reset_timestamps 1'
    ])
    .output(segmentPattern)
    .on('end', () => {
      sendSegments(tempDir);
    })
    .on('error', err => {
      console.error(`Error segmenting file: ${err.message}`);
      streamFile();
    })
    .run();
};

const sendSegments = (tempDir) => {
  const segments = fs.readdirSync(tempDir).filter(file => file.endsWith('.mp3'));
  let index = 0;

  const interval = setInterval(() => {
    if (index < segments.length) {
      const segmentPath = path.join(tempDir, segments[index]);
      const segment = fs.readFileSync(segmentPath);
      io.emit('audio', segment);
      index++;
    } else {
      clearInterval(interval);
      fs.rmSync(tempDir, { recursive: true, force: true });
      streamFile();
    }
  }, 1000); // Send each segment every second
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

app.use(express.static(path.join(__dirname, 'public')));

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
