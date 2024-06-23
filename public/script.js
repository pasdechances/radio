const socket = io();
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioPlayer = document.getElementById('audioPlayer');
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
let audioWorkletNode = null;
let gainNode = null;
let source = null;
let startTime = 0;
let elapsedTime = 0;
let isPlaying = false;
let muted = false;
let seeking = false;
let audioQueue = [];
let audioBuffer = null;
let oneTime = true

/* 
    The DIY player wanted, reach a step where i need to learn more about buffer/AudioWorkletNode.
    Last error on file worklet-processor.js => Output channel length does not match buffer length.
*/

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
    if(!oneTime) return;
    const uint8Chunk = new Uint8Array(chunk);
    if (context === null) {
        initializeAudioContext().then(() => {
            decodeAndQueueAudio(uint8Chunk);

        });
    } else {
        decodeAndQueueAudio(uint8Chunk);
    }
});

async function initializeAudioContext() {
    context = new AudioContext();
    gainNode = context.createGain();
    gainNode.gain.value = volumeRange.value / 10;
    gainNode.connect(context.destination);

    await context.audioWorklet.addModule('worklet-queue.js');
    await context.audioWorklet.addModule('worklet-processor.js');

    procWorkletNode = new AudioWorkletNode(context, 'audio-processor');
    queueWorkletNode = new AudioWorkletNode(context, 'audio-queue');
    procWorkletNode.connect(gainNode);
    procWorkletNode.port.onmessage = (event) => {
        if (event.data === 'need-more-data') {
            console.log("waiting data");
            sendNextSegment()
        }
    };
}

function decodeAndQueueAudio(uint8Chunk) {
    context.decodeAudioData(uint8Chunk.buffer, buffer => {
        const numberOfChannels = buffer.numberOfChannels
        let channelData = [];
        for (let i = 0; i < numberOfChannels; ++i) {
            channelData[i] = buffer.getChannelData(i);
        }
        
        const segmentSize = 128;
        const channelDataLength = channelData.length
        let maxLength = 0;
        
        for (let i = 0; i < channelDataLength; ++i) {
            const length = channelData[i].length;
            if (length > maxLength) {
                maxLength = length;
            }
        }

        for (let i = 0; i < maxLength; i += segmentSize) {
            let segment = [];
            for (let x = 0; x < channelDataLength; ++x) {
                let bound =  Math.min(i + segmentSize, maxLength)
                segment[x] = channelData[x].subarray(i,bound)
            }
            audioQueue.push(segment);
        }
        sendNextSegment()        
    });
}

function sendNextSegment() {
    if (audioQueue.length > 0 && queueWorkletNode) {
        let audioData = []
        audioData = audioQueue;
        for (let i = 0; i < audioData.length; ++i){
            queueWorkletNode.port.postMessage(audioData.shift());
        }
    }
}

// function playBuffer() {
//     if (audioQueue.length > 0) {
//         const buffer = audioQueue.shift();
//         const nextSource = context.createBufferSource();
//         nextSource.buffer = buffer;
//         nextSource.connect(gainNode);

//         const currentTime = context.currentTime;
//         const startTime = Math.max(currentTime, context.currentTime + elapsedTime);

//         nextSource.start(startTime);
//         elapsedTime = buffer.duration;
        
//         nextSource.onended = () => {
//             playBuffer();
//         };

//         isPlaying = true;
//         updateElapsedTime();
//     } else {
//         isPlaying = false;
//     }
// }

function updateElapsedTime() {
    if (isPlaying && !seeking) {
        elapsedTime = context.currentTime - startTime;
        timeText.innerHTML = elapsedTime.toFixed(0);
        timeRange.value = elapsedTime;
        requestAnimationFrame(updateElapsedTime);
    }
}




// Default audio player => change to a DIY audioplayer (up)
// const mediaSource = new MediaSource();
// let play = false

// audioPlayer.src = URL.createObjectURL(mediaSource);

// audioPlayer.addEventListener("play", () => {
//     play = !play
// });

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
//         play = !play
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

