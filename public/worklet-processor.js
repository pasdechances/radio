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
        if (this.queue.length > 0) {
            const buffer = this.queue.shift();
            for (let channel = 0; channel < output.length; ++channel) {
                // Vérifier que le canal de sortie a la même longueur que le buffer
                if (output[channel].length !== buffer.length) {
                    console.warn('Output channel length does not match buffer length.');
                    continue;
                }

                // Copier les données du buffer dans le canal de sortie
                output[channel].set(buffer, 0); // Assurez-vous que l'offset est correct
            }
        } else {
            this.port.postMessage('need-more-data');
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
