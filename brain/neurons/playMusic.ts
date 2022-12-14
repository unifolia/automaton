import Synth from "./synthProto";
import copyBuffer from "./copyBuffer";

/**
 * @function playMusic create/start/stop pad oscillator
 * @function createReverb create convolution reverb
 * @param noteFreq frequency of the note to play (determined at grid creation)
 *
 * @function connect/start/stop/disconnect control audioContext or oscillator
 */
const playMusic = async (noteFreq: number, arrayBuffer: ArrayBuffer, speed: number) => {
    const synth = new Synth(noteFreq);

    const createReverb = async () => {
        let convolver = synth.audioContext.createConvolver();
        const bufferCopy = copyBuffer(arrayBuffer.slice(0));
        convolver.buffer = await synth.audioContext.decodeAudioData(bufferCopy);
        return convolver;
    };

    const reverb = await createReverb();
    reverb.connect(synth.gainNode);
    synth.oscillatorEngine.connect(reverb);
    synth.oscillatorEngine.start();

    const noteBuffer = new Promise((res) => setTimeout(res, speed * 0.85));
    await noteBuffer.then(() => {
        synth.oscillatorEngine.stop();
        synth.oscillatorEngine.disconnect();
    });

    const reverbBuffer = new Promise((res) => setTimeout(res, speed * 1.45));
    await reverbBuffer.then(() => {
        synth.audioContext.close();
    });
};

export default playMusic;
