class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.queue = [];
        this.queueLengthMinload = 100
        this.queueLengthPreload = 88200
        this.preload = true;
        this.port.onmessage = (event) => {
            if (event.data) {
                let nbChannel = event.data.length
                for (let index = 0; index < nbChannel; index++) {
                    if (!this.queue[index]) {
                        this.queue[index] = [];
                    }
                    console.log(this.queue[index].length)
                    this.queue[index].push(...event.data[index]);
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        let output = outputs[0];
        let segment = [];
        if(this.queue){
            for (let x = 0; x < output.length; ++x) {
                let length = this.queue[0].length
                if(length < this.queueLengthMinload){
                    this.preload = true;
                } else if(length > this.queueLengthPreload){
                    this.preload = false;
                }
                
                if (!this.preload) {
                    segment[x] = this.queue[x].splice(0, 128);
                    output[x].set(segment[x]);
                }
            }  
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
