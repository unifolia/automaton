/**
 * @class {Synth} individual synthesizer
 */
class Synth {
    types: string[];
    oscillatorEngine: OscillatorNode;
    audioContext: AudioContext;
    gainNode: GainNode;

    constructor(i: number) {
        this.types = ["sawtooth", "sine", "square", "triangle"];
        this.audioContext = new window.AudioContext();

        this.oscillatorEngine = this.audioContext.createOscillator();
        this.oscillatorEngine.type = "sine";
        this.oscillatorEngine.frequency.setValueAtTime(i, this.audioContext.currentTime);

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.15;
        this.gainNode.connect(this.audioContext.destination);
    }
}

/**
 * @function noteFrom determines what note to play for @param padId pad
 */
const noteFrom = (padId: number) => {
    const tuning = 440;
    const A440 = Math.pow(2, 1 / 12);

    const row = Math.floor((padId - 1) / 8) + 1;
    padId = padId - row * 5 - 17;

    const octave = Math.floor(padId / 7 + 2);

    if ((padId + 7) % 7 === 0) padId = padId + octave * 5;
    else if ((padId + 6) % 7 === 0) padId = padId + octave * 5 + 1;
    else if ((padId + 5) % 7 === 0) padId = padId + octave * 5 + 2;
    else if ((padId + 4) % 7 === 0) padId = padId + octave * 5 + 2;
    else if ((padId + 3) % 7 === 0) padId = padId + octave * 5 + 3;
    else if ((padId + 2) % 7 === 0) padId = padId + octave * 5 + 4;
    else if ((padId + 1) % 7 === 0) padId = padId + octave * 5 + 5;

    return +(tuning * Math.pow(A440, padId)).toFixed(4);
};

function copyBuffer(buffer: ArrayBuffer) {
    let copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buffer));
    return copy;
}

document.addEventListener("DOMContentLoaded", async () => {
    // Grid/pad info
    type PadArray = HTMLDivElement[];
    const allPads = [...document.querySelectorAll(".pad")] as PadArray;
    let activePads: PadArray = [];
    const grid = document.querySelector(".grid");
    const gridSize = allPads.length;
    const frequencyList: number[] = [];

    // Buttons/status info
    const playButton = document.querySelector(".playButton");
    const resetButton = document.querySelector(".resetButton");
    let isPlaying: boolean = false;
    let timer: number;

    // Stats
    const mode = 3;
    const speed = 3000;
    let generationLog: Array<PadArray> = [];

    // Audio components
    const cors = window.location.href.includes("file")
        ? "https://cors-anywhere.herokuapp.com/"
        : "";
    let response = await fetch(`${cors}https://jameslewis.io/assets/Output%201-2.wav`);
    let arraybuffer: ArrayBuffer = await response.arrayBuffer();

    /**
     * @function returnSurroundingElements return pads surrounding another pad
     */
    const returnSurroundingElements = (gridSize: number, idArray: number[], padId: number) => {
        const rowLen = Math.sqrt(gridSize);
        const al = padId + rowLen - 1;
        const a = padId + rowLen;
        const ar = padId + rowLen + 1;
        const l = padId - 1;
        const r = padId + 1;
        const bl = padId - rowLen - 1;
        const b = padId - rowLen;
        const br = padId - rowLen + 1;

        return [al, a, ar, l, r, bl, b, br]
            .map((surrounding) => {
                return idArray.includes(surrounding);
            })
            .filter((isActive) => isActive !== false);
    };

    /**
     * @function updateState update elements when isPlaying changes
     */
    const updateState = () => {
        playButton!.className = isPlaying ? "playButton playing" : "playButton";
        playButton!.innerHTML = isPlaying ? "Stop" : "Play";
        grid!.className = isPlaying ? "main grid playing" : "main grid";
    };

    /**
     * @function resetState reset grid
     */
    const resetState = () => {
        isPlaying = false;

        clearInterval(timer);
        activePads.forEach((pad) => {
            pad.classList.remove("active");
        });
        activePads = [];
        generationLog = [];

        updateState();
    };

    /**
     * @function generationController compare current pattern to previous pattern, destroy all if plateaued
     */
    const generationController = () => {
        generationLog.push(activePads);

        if (generationLog.length > 2) {
            generationLog.shift();

            const [lastGen, currentGen] = generationLog.map((array) => {
                let ids = array.map((div) => div.id);
                if (ids.length > 0) return array.map((div) => div.id).reduce((a, b) => a + b);
                return "empty";
            });

            if (lastGen === currentGen) resetState();
        }
    };

    /**
     * @function playMusic create/start/stop pad oscillator
     * @function createReverb create convolution reverb
     * @param noteFreq frequency of the note to play (determined at grid creation)
     */
    const playMusic = async (noteFreq: number) => {
        const synth = new Synth(noteFreq);

        const createReverb = async () => {
            let convolver = synth.audioContext.createConvolver();
            const bufferCopy = copyBuffer(arraybuffer.slice(0));
            convolver.buffer = await synth.audioContext.decodeAudioData(bufferCopy);
            return convolver;
        };

        const reverb = await createReverb();

        reverb.connect(synth.gainNode);
        synth.oscillatorEngine.connect(reverb);
        synth.oscillatorEngine.start();

        const noteBuffer = new Promise((res) => setTimeout(res, speed * 0.85));
        const reverbBuffer = new Promise((res) => setTimeout(res, speed * 1.45));
        await noteBuffer.then(() => {
            synth.oscillatorEngine.stop();
            synth.oscillatorEngine.disconnect();
        });
        await reverbBuffer.then(() => {
            synth.audioContext.close();
        });
    };

    /**
     * @function play start cellular automaton transformations
     */
    const play = () => {
        const activePadIds = activePads.map((activePad) => {
            return +activePad.id;
        });

        /**
         * @function allPads.forEach calculate surrounding active elements, then sustain/kill element
         * @tutorial https://en.wikipedia.org/wiki/Cellular_automaton
         *
         * @function playMusic create/start/stop pad oscillator @param noteFreq
         * @function generationController compare current pattern to previous pattern, destroy all if plateaued
         */
        allPads.forEach((pad, padId) => {
            const isActive = pad.classList.contains("active");
            const surroundingElementsNum = returnSurroundingElements(
                gridSize,
                activePadIds,
                +pad.id
            ).length;

            if (
                (!isActive && surroundingElementsNum === mode) ||
                (isActive &&
                    (surroundingElementsNum === mode || surroundingElementsNum === mode - 1))
            ) {
                playMusic(frequencyList[padId]);

                if (!activePads.includes(pad)) activePads.push(pad);
                if (!isActive) pad.classList.add("active");
            } else {
                activePads = activePads.filter((item) => item !== pad);
                if (isActive) pad.classList.remove("active");
            }
        });
        generationController();
    };

    /**
     * @function createFrequencyMap map pads to musical notes
     */
    const createFrequencyMap = (padId: number) => {
        const padNote = noteFrom(gridSize - padId);
        frequencyList.push(padNote);

        return padNote;
    };

    /**
     * @function allPads.forEach grid setup
     * @function clickEvent select/de-select pads individually
     *
     * @function createFrequencyMap map pads to musical notes
     * @function playMusic create/start/stop pad oscillator
     */
    allPads.forEach((pad, padId) => {
        const boxNumStr = `${gridSize - padId}`;
        pad.id = boxNumStr;

        const freq = createFrequencyMap(padId);

        pad.addEventListener("click", () => {
            if (!isPlaying) {
                if (!activePads.includes(pad)) {
                    playMusic(freq);

                    pad.classList.add("active");
                    activePads.push(pad);
                } else {
                    activePads = activePads.filter((item) => item !== pad);
                    pad.classList.remove("active");
                }
            }
        });
    });

    /**
     * @event click toggle cellular automaton on/off
     *
     * @function updateState update elements when isPlaying changes
     * @function play start cellular automaton transformations
     */
    playButton?.addEventListener("click", () => {
        isPlaying = !isPlaying;
        updateState();

        if (isPlaying === true) {
            play();
            timer = setInterval(() => play(), speed);
        } else clearInterval(timer);
    });

    /**
     * @event click @function resetState reset grid
     */
    resetButton?.addEventListener("click", () => {
        resetState();
    });
});
