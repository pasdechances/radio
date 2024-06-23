class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queue = [];
        this.queueLengthMinload = 750
        this.queueLengthPreload = 950
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
                console.log(this.queue.length)
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (this.queue.length > this.queueLengthMinload) {
            let segment = this.queue.shift()
            for (let x = 0; x < output.length; ++x) {
                if (x < segment.length){
                    output[x].set(segment[x]);
                }
            }
        }
        if(this.queue.length < this.queueLengthPreload){
           // this.port.postMessage('need-more-data');
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
