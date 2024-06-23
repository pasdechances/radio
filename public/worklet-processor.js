class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queue = [];
        this.port.onmessage = (event) => {
            if (event.data) {
                this.queue.push(event.data);
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        for (let channel = 0; channel < output.length; ++channel) {
            if (this.queue.length > 0) {
                const buffer = this.queue.shift();
                output[channel].set(buffer.subarray(0, output[channel].length), 0);
            } else {
                this.port.postMessage('need-more-data');
            }
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
