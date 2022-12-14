/**
 * @class individual synthesizer
 * @param i oscillatorNode's frequency
 * @oscillatoreEngineType random waveform type at generation
 */
class Synth {
    private types: string[];
    oscillatorEngine: OscillatorNode;
    audioContext: AudioContext;
    gainNode: GainNode;

    constructor(i: number) {
        this.types = ["sawtooth", "sine", "square", "triangle"];
        this.audioContext = new window.AudioContext();

        this.oscillatorEngine = this.audioContext.createOscillator();
        this.oscillatorEngine.type = this.types[Math.floor(Math.random() * 4)] as OscillatorType;
        this.oscillatorEngine.frequency.setValueAtTime(i, this.audioContext.currentTime);

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.1;
        this.gainNode.connect(this.audioContext.destination);

        console.log(this.audioContext, "create audio context");
    }
}

export default Synth;
