const socket = io();
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const sendButton = document.getElementById('sendButton');
const text = document.getElementById('text');
const chat = document.getElementById('chat');
const room1 = document.getElementById('room1');
const room2 = document.getElementById('room2');
const room3 = document.getElementById('room3');
const lobby = document.getElementById('lobby');
const volumeText = document.getElementById('volume');
const volumeRange = document.getElementById('volume-range');
const volumeMute = document.getElementById('volume-Mute');
const playButton = document.getElementById('play');
const stopButton = document.getElementById('stop');
const timeText = document.getElementById('time');
const timeRange = document.getElementById('time-range');

let context = null;
let gainNode = null;
let source = null;
let startTime = 0;
let elapsedTime = 0;
let isPlaying = false;
let muted = false;
let seeking = false;
let audioQueue = [];
let audioBuffer = null;


volumeRange.addEventListener('input', () => {
    if (gainNode) {
        gainNode.gain.value = volumeRange.value / 10;
    }
    volumeText.innerText = volumeRange.value;
});

volumeMute.addEventListener('click', () => {
    muted = !muted;
    if (gainNode) {
        gainNode.gain.value = muted ? 0 : volumeRange.value / 10;
    }
    volumeMute.innerText = muted ? "Mute On" : "Mute Off";
});

socket.on('audio', chunk => {
    const uint8Chunk = new Uint8Array(chunk);
    if (context === null) {
        initializeAudioContext();
    }
    context.decodeAudioData(uint8Chunk.buffer, buffer => {
        audioQueue.push(buffer);
        if (!isPlaying) {
            playBuffer();
        }
    });
});

function initializeAudioContext() {
    context = new AudioContext();
    gainNode = context.createGain();
    gainNode.gain.value = volumeRange.value / 10;
    gainNode.connect(context.destination);
}

function playBuffer() {
    if (audioQueue.length > 2) {
        audioBuffer = audioQueue.shift();
        source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);
        source.start(0);
        source.onended = () => {
            isPlaying = false;
            playBuffer();
        };
        startTime = context.currentTime;
        isPlaying = true;
        requestAnimationFrame(updateElapsedTime);
    } else {
        isPlaying = false;
    }
}

function updateElapsedTime() {
    if (isPlaying && !seeking) {
        elapsedTime = context.currentTime - startTime;
        timeText.innerHTML = elapsedTime.toFixed(0);
        timeRange.value = elapsedTime;
        requestAnimationFrame(updateElapsedTime);
    }
}

// const mediaSource = new MediaSource();
// let play = false

// audioPlayer.src = URL.createObjectURL(mediaSource);

// mediaSource.addEventListener('sourceopen', () => {
//     const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
//     let audioQueue = [];
    
//     sourceBuffer.addEventListener('updateend', () => {
//         console.log("end update, buffer lenght", sourceBuffer.buffered.length)
//         if (sourceBuffer.buffered.length > 1) {
//             const bufferedEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 2);
//             console.log("bufferend : ",bufferedEnd)
//             if(bufferedEnd > 10) sourceBuffer.remove(0, bufferedEnd);
//         }
//     });
    
//     sourceBuffer.addEventListener('error', (e) => {
//         console.error('SourceBuffer error:', e);
//     });
    
//     socket.on('audio', chunk => {
//         if(!play){
//             audioQueue = []
//             return;
//         } 
//         const uint8Chunk = new Uint8Array(chunk);
//         audioQueue.push(uint8Chunk);
//         if (audioQueue.length > 0) {
//             if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
//                 console.log("add buff")
//                 sourceBuffer.appendBuffer(audioQueue.shift());
//             }
//         }                
//     });

//     toggleButton.addEventListener('click', () => {
//         if(play)
//             play = false
//         else
//             play = true
//     });
// });

// mediaSource.addEventListener('sourceended', () => {
//     console.log('MediaSource ended');
// });

// mediaSource.addEventListener('sourceclose', () => {
//     console.log('MediaSource closed');
// });




room1.addEventListener('click', () => {
    socket.emit('GotoRoom1');
    chat.innerHTML = "";
});

room2.addEventListener('click', () => {
    socket.emit('GotoRoom2');
    chat.innerHTML = "";
});

room3.addEventListener('click', () => {
    socket.emit('GotoRoom3');
    chat.innerHTML = "";
});

lobby.addEventListener('click', () => {
    socket.emit('GotoLobby');
    chat.innerHTML = "";
});

socket.on('serverMessage', msg => {
    const item = document.createElement('li');
    item.textContent = msg;
    chat.appendChild(item);
});

sendButton.addEventListener('click', () => {
    socket.emit('userMessage', text.value);
    text.value = '';
});
