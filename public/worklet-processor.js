class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queueLengthMinload = 10
        this.queueLengthPreload = 1250
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const queueLength = globalThis.queue.length

        if (queueLength > this.queueLengthMinload) {
            let segment = globalThis.queue.shift()
            for (let x = 0; x < output.length; ++x) {
                if (x < segment.length){
                    output[x].set(segment[x]);
                }
            }
        }
        if(queueLength < this.queueLengthPreload){
           this.port.postMessage('need-more-data');
           console.log(queueLength)
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
