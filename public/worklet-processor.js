class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.preload = true;
        this.queueLengthMinload = 10
        this.queueLengthPreload = 3250
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const queueLength = globalThis.queue.length
        if(queueLength < this.queueLengthMinload){
            this.preload = true;
        } else if(queueLength > this.queueLengthPreload){
            this.preload = false;
        }

        if (!this.preload) {
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
