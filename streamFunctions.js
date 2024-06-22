const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

const audioDir = path.join(__dirname, 'audio');
const TimeBeforeEndOfCurrentFile = 60;
let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));
let nextMusicFile = null;
let nextMusicFileName = null;
let urlAPI = 'http://localhost:3001';

const streamFile = async (room) => {
  if (!nextMusicFile) {
    await loadNextMusic();
  }

  const musicFilePath = nextMusicFile;
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
      sendSegments(tempDir, room); 
    })
    .on('error', err => {
      console.error(`Error segmenting file: ${err.message}`);
      fs.rmSync(tempDir, { recursive: true, force: true }); 
      streamFile(room); 
    })
    .run();
};

const sendSegments = (tempDir, room) => { 
  const segments = fs.readdirSync(tempDir).filter(file => file.endsWith('.mp3'));
  let index = 0;
  let segmentInterval;
  let preloading = false;

  const preloadAndStream = () => {
    if (!preloading && index === segments.length - TimeBeforeEndOfCurrentFile) {
      preloading = true;
      loadNextMusic().catch(err => {
        console.error(`Error preloading next music file: ${err.message}`);
      });
    }

    if (index < segments.length) {
      const segmentPath = path.join(tempDir, segments[index]);
      const segment = fs.readFileSync(segmentPath);
      room.emit('audio', segment);
      index++;
    } else {
      clearInterval(segmentInterval);
      fs.rmSync(tempDir, { recursive: true, force: true });
      streamFile(room);
    }
  };

  segmentInterval = setInterval(preloadAndStream, 1000);
};

const loadNextMusic = async () => {
  try {
    const response = await axios.get(`${urlAPI}/random-music`, { responseType: 'stream' });
    const musicFilePath = path.join(os.tmpdir(), response.headers['x-music-name']);
    const writer = fs.createWriteStream(musicFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        nextMusicFile = musicFilePath;
        nextMusicFileName = response.headers['x-music-name'];
        resolve();
      });

      writer.on('error', (err) => {
        console.error(`Error writing file: ${err.message}`);
        reject(err);
      });
    });
  } catch (err) {
    console.error(`Error fetching music file from API: ${err.message}`);
    console.log('Loading a local file instead.');
    return loadLocalMusic();
  }
};

const loadLocalMusic = () => {
  return new Promise((resolve, reject) => {
    if (audioFiles.length === 0) {
      console.error('No local audio files available');
      return reject(new Error('No local audio files available'));
    }

    if (currentIndex >= audioFiles.length) {
      currentIndex = 0;
    }
    const localFile = audioFiles[currentIndex];
    currentIndex++;
    nextMusicFile = path.join(audioDir, localFile);
    nextMusicFileName = localFile;
    resolve();
  });
};

module.exports = { streamFile };
