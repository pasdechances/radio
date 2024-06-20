const socket = io();
const audioPlayer = document.getElementById('audioPlayer');
const sendButton = document.getElementById('sendButton');
const text = document.getElementById('text');
const chat = document.getElementById('chat');
const mediaSource = new MediaSource();

audioPlayer.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
    let audioQueue = [];
    
    sourceBuffer.addEventListener('updateend', () => {
        if (audioQueue.length > 0) {
            if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                sourceBuffer.appendBuffer(audioQueue.shift());
            }
        }
        
        if (sourceBuffer.buffered.length > 0) {
            const bufferedEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
            const currentTime = audioPlayer.currentTime;
            const minBufferedTime = 30;
            
            if (bufferedEnd > currentTime && bufferedEnd - currentTime > minBufferedTime) {
                try {
                    const removeStart = Math.max(0, currentTime - minBufferedTime);
                    //sourceBuffer.remove(0, removeStart);
                } catch (e) {
                    console.error('Error removing buffer:', e);
                }
            }
        }
    });
    
    sourceBuffer.addEventListener('error', (e) => {
        console.error('SourceBuffer error:', e);
    });
    
    socket.on('audio', chunk => {
        const uint8Chunk = new Uint8Array(chunk);
        if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
            if (sourceBuffer.buffered.length > 0) {
                const bufferedEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
                const minBufferedTime = 30;
                
                if (bufferedEnd > minBufferedTime) {
                    try {
                        sourceBuffer.remove(0, minBufferedTime - 1);
                    } catch (e) {
                        console.error('Error removing buffer:', e);
                    }
                }
            }
            try {
                sourceBuffer.appendBuffer(uint8Chunk);
            } catch (e) {
                console.error('Error appending buffer:', e);
                audioQueue.push(uint8Chunk);
            }
        } else {
            audioQueue.push(uint8Chunk);
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
});

mediaSource.addEventListener('sourceended', () => {
    console.log('MediaSource ended');
});

mediaSource.addEventListener('sourceclose', () => {
    console.log('MediaSource closed');
});