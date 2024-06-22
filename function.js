const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const socketIo = require('socket.io');

const audioDir = path.join(__dirname, 'audio');
let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));

const streamFile = (io) => {
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
      sendSegments(tempDir, io);
    })
    .on('error', err => {
      console.error(`Error segmenting file: ${err.message}`);
      streamFile(io);
    })
    .run();
};

const sendSegments = (tempDir, io) => {
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
      streamFile(io);
    }
  }, 1000); // Send each segment every second
};

module.exports = { streamFile };
