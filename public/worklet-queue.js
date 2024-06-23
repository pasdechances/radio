class AudioQueue extends AudioWorkletProcessor {
    constructor() {
        super();
        globalThis.queue = [];
        
        this.port.onmessage = (event) => {
            if (event.data) {
                globalThis.queue.push(event.data);
            }
        };
    }

    process(inputs, outputs, parameters) {
        return true;
    }
}

registerProcessor('audio-queue', AudioQueue);
