class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (queueWorkletNode.queue.length > queueWorkletNode.queueLengthMinload) {
            let segment = queueWorkletNode.queue.shift()
            for (let x = 0; x < output.length; ++x) {
                if (x < segment.length){
                    output[x].set(segment[x]);
                }
            }
        }
        if(queueWorkletNode.queue.length < queueWorkletNode.queueLengthPreload){
           //this.port.postMessage('need-more-data');
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
