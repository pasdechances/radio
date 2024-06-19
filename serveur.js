const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Si FFmpeg n'est pas dans le PATH, spécifiez le chemin directement
//ffmpeg.setFfmpegPath('C:\\Path\\To\\ffmpeg\\bin\\ffmpeg.exe');

const app = express();
const port = 3000;
const audioDir = path.join(__dirname, 'audio');

let currentIndex = 0;
let audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3') || file.endsWith('.mp4'));

app.get('/radio', (req, res) => {
  const streamFile = () => {
    if (currentIndex >= audioFiles.length) {
      currentIndex = 0; // Restart playlist
    }
    const filePath = path.join(audioDir, audioFiles[currentIndex]);
    currentIndex++;

    ffmpeg(filePath)
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('end', () => {
        // Delay before playing the next file
        setTimeout(streamFile, 1000); // Adjust the delay as needed
      })
      .on('error', err => {
        console.error(`Error streaming file: ${err.message}`);
        // Skip the problematic file
        streamFile();
      })
      .pipe(res, { end: false });
  };

  res.setHeader('Content-Type', 'audio/mpeg');
  streamFile();
});

app.listen(port, () => {
  console.log(`Web radio server running at http://localhost:${port}`);
});
