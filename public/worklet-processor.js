class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queue = [];
        this.queueLengthMinload = 100
        this.queueLengthPreload = 2050
        this.preload = true;
        this.port.onmessage = (event) => {
            if (event.data) {
                const segmentSize = 128;
                const buffer = event.data;
                const bufferLength = buffer.length
                let maxLength = 0;
                
                for (let i = 0; i < bufferLength; ++i) {
                    const length = buffer[i].length;
                    if (length > maxLength) {
                        maxLength = length;
                    }
                }

                for (let i = 0; i < maxLength; i += segmentSize) {
                    let segment = [];
                    for (let x = 0; x < bufferLength; ++x) {
                        let bound =  Math.min(i + segmentSize, maxLength)
                        segment[x] = buffer[x].subarray(i,bound)
                    }
                    this.queue.push(segment);
                }
            }
            console.log('cut ?')
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        let length = this.queue.length
        if(length < this.queueLengthMinload){
            this.preload = true;
        } else if(length > this.queueLengthPreload){
            this.preload = false;
        }

        if (!this.preload) {
            let segment = this.queue.shift()
            for (let x = 0; x < output.length; ++x) {
                if (x < segment.length){
                    output[x].set(segment[x]);
                }
            }
        }
        console.log(length)
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
