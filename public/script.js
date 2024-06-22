const socket = io();
const audioPlayer = document.getElementById('audioPlayer');
const sendButton = document.getElementById('sendButton');
const text = document.getElementById('text');
const chat = document.getElementById('chat');
const mediaSource = new MediaSource();
let play = false

audioPlayer.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
    let audioQueue = [];
    
    sourceBuffer.addEventListener('updateend', () => {
        console.log("end update, buffer lenght", sourceBuffer.buffered.length)
        if (sourceBuffer.buffered.length > 1) {
            const bufferedEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 2);
            console.log("bufferend : ",bufferedEnd)
            if(bufferedEnd > 10) sourceBuffer.remove(0, bufferedEnd);
        }
    });
    
    sourceBuffer.addEventListener('error', (e) => {
        console.error('SourceBuffer error:', e);
    });
    
    socket.on('audio', chunk => {
        if(!play){
            audioQueue = []
            return;
        } 
        const uint8Chunk = new Uint8Array(chunk);
        audioQueue.push(uint8Chunk);
        if (audioQueue.length > 0) {
            if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                console.log("add buff")
                sourceBuffer.appendBuffer(audioQueue.shift());
            }
        }                
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
    toggleButton.addEventListener('click', () => {
        if(play)
            play = false
        else
            play = true
    });
});

mediaSource.addEventListener('sourceended', () => {
    console.log('MediaSource ended');
});

mediaSource.addEventListener('sourceclose', () => {
    console.log('MediaSource closed');
});