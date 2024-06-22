window.AudioContext = window.AudioContext || window.webkitAudioContext;
const volumeText = document.getElementById('volume');
const volumeRange = document.getElementById('volume-range');
const volumeMute = document.getElementById('volume-Mute');
const playButton = document.getElementById('play');
const stopButton = document.getElementById('stop');
const shuffleButton = document.getElementById('shuffle');
const timeText = document.getElementById('time');
const timeRange = document.getElementById('time-range');

let context = new AudioContext();
let gainNode = context.createGain();
let audioBuffer = null;
let source = null;
let startTime = 0;
let pauseTime = 0;
let elapsedTime = 0;
let isPlaying = false;
let manuallyStopped = false;
let muted = false;
let seeking = false;
let isLoadingTrack = false;

async function loadAudio(url) {
    try {
        resetAudio()
        isLoadingTrack = true;
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await context.decodeAudioData(arrayBuffer);
        playBuffer();
    } catch (err) {
        console.error(`Unable to fetch the audio file. Error: ${err.message}`);
    } finally {
        isLoadingTrack = false;
    }
}

function playBuffer() {
    if (audioBuffer) {
        source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(context.destination);
        source.loop = false;
        startTime = context.currentTime - elapsedTime;
        console.log(elapsedTime)
        source.start(0, elapsedTime);
        isPlaying = true;
        manuallyStopped = false;
        source.onended = onEndTrack
        requestAnimationFrame(updateElapsedTime);
    }
}

function onEndTrack(){
    isPlaying = false;
    if (!manuallyStopped && !isLoadingTrack) {
        loadAudio("/random-music")
    } 
    else if(seeking) {
        playBuffer();
        seeking = false;
    }
};

function stopPlayback() {
    manuallyStopped = true
    if (isPlaying) {
        source.stop();
        source.disconnect();
        isPlaying = false;
        source = null;
    }
}

function updateElapsedTime() {
    if (isPlaying && !seeking) {
        elapsedTime = context.currentTime - startTime;
        timeText.innerHTML = elapsedTime.toFixed(0);
        timeRange.max = audioBuffer.duration;
        timeRange.value = elapsedTime;
        requestAnimationFrame(updateElapsedTime);
    }
}

function resetAudio(){
    elapsedTime = 0
    context.currentTime = 0
    audioBuffer = null;
}

shuffleButton.onclick = () => {
    stopPlayback()
    loadAudio("/random-music")
};

stopButton.onclick = () => {
    stopPlayback();
};

playButton.onclick = () => {
    if (!isPlaying) {
        playBuffer();
    }
};

timeRange.oninput = () => {
    seeking = true;
    timeText.innerHTML = timeRange.value;
};

timeRange.onchange = () => {
    elapsedTime = parseFloat(timeRange.value);
    if (isPlaying) {
        stopPlayback();
    }
};

volumeRange.oninput  = () => {
    gainNode.gain.value = volumeRange.value / 10;
    volumeText.innerText = volumeRange.value;
};

volumeMute.onclick  = () => {
    if(!muted){
        gainNode.gain.value = 0;
        volumeMute.innerText = " Mute On";
    }
    else{
        gainNode.gain.value = volumeRange.value / 10;
        volumeMute.innerText = " Mute Off";
    }
    muted=!muted
};

loadAudio("/random-music");