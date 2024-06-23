class AudioQueue extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queue = [];
        this.queueLengthMinload = 750
        this.queueLengthPreload = 950
        this.port.onmessage = (event) => {
            if (event.data) {
                this.queue.push(event.data);
                console.log(this.queue.length)
            }
        };
    }

    process(inputs, outputs, parameters) {
        return true;
    }
}

registerProcessor('audio-queue', AudioProcessor);
