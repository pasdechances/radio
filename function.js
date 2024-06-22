const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const { error } = require('console');

const audioDir = path.join(__dirname, 'audio');
let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));
let errorCount = 0;

const streamFile = async (io) => {
  try {
    const response = await axios.get('http://localhost:3001/random-music', { responseType: 'stream' });
    const musicFilePath = path.join(os.tmpdir(), response.headers['x-music-name']);
    console.log(response.headers['x-music-name'])
    const writer = fs.createWriteStream(musicFilePath);

    response.data.pipe(writer);

    writer.on('finish', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-segments-'));
      const segmentPattern = path.join(tempDir, 'segment-%03d.mp3');

      ffmpeg(musicFilePath)
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
    });

    writer.on('error', err => {
      console.error(`Error writing file: ${err.message}`);
    });
  } catch (err) {
    console.error(`Error fetching music file: ${err.message}`);
    errorCount++
    if(errorCount < 100){
      streamFile(io);
    }
    else{
      console.log(`server stoped`);
    }
  }
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
