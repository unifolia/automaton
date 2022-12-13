/**
 * @class individual synthesizer
 * @param i oscillatorNode's frequency
 * @oscillatoreEngine random waveform type on generation
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
        this.oscillatorEngine.type = this.types[Math.floor(Math.random() * 4)] as OscillatorType;
        this.oscillatorEngine.frequency.setValueAtTime(i, this.audioContext.currentTime);

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.1;
        this.gainNode.connect(this.audioContext.destination);
    }
}

/**
 * @function calculateNotes determines what note to play for @param padId pad
 * @returns [frequency to play, KEY CHANGE frequency to play]
 *
 * @description: I never want to do this math ever again
 */
const calculateNotes = (padId: number) => {
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

    return [
        // Standard notes / G major scale
        +(tuning * Math.pow(A440, padId)).toFixed(4),
        // Key change / Bb Major
        +(tuning * Math.pow(A440, padId + 3)).toFixed(4),
    ];
};

/**
 * @function copyBuffer @returns true copy of impulse response array buffer
 */
const copyBuffer = (buffer: ArrayBuffer) => {
    let copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buffer));
    return copy;
};

document.addEventListener("DOMContentLoaded", async () => {
    // Grid/pad info
    type PadArray = HTMLDivElement[];
    const allPads = [...document.querySelectorAll(".pad")] as PadArray;
    let activePads: PadArray = [];
    const grid: HTMLElement = document.querySelector(".grid")!;
    const gridSize = allPads.length;

    // Buttons
    const playButton = document.querySelector(".playButton");
    const resetButton = document.querySelector(".resetButton");
    const modeButton = document.querySelector(".modeButton");

    // Statistics
    const automatonNumber = 3;
    const speed = 3000;

    let mode = "Mode: Classic";
    let timer: number;
    let isPlaying: boolean = false;
    let generation: number = 0;
    let generationLog: Array<PadArray> = [];

    // Audio components
    // CORS for local development
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
        playButton!.innerHTML = isPlaying ? "Stop" : "Play";

        grid!.className = isPlaying ? "main grid playing" : "main grid";
        modeButton!.className = isPlaying ? "modeButton playing" : "modeButton";
    };

    /**
     * @function resetState reset grid
     */
    const resetState = () => {
        isPlaying = false;
        clearInterval(timer);
        updateState();

        activePads.forEach((pad) => {
            pad.classList.remove("active");
        });

        generation = 0;
        generationLog = [];
        activePads = [];
    };

    /**
     * @function generationController compare current pattern to previous pattern, destroy all if plateaued
     *
     * @function resetState reset grid
     */
    const generationController = () => {
        ++generation;
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
     *
     * @function connect/start/stop/disconnect control audioContext or oscillator
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
        await noteBuffer.then(() => {
            synth.oscillatorEngine.stop();
            synth.oscillatorEngine.disconnect();
        });

        const reverbBuffer = new Promise((res) => setTimeout(res, speed * 1.45));
        await reverbBuffer.then(() => {
            synth.audioContext.close();
        });
    };

    /**
     * @function classicMode play notes according to Conyway's Game of Life
     */
    const classicMode = (
        pad: HTMLDivElement,
        _padId: number,
        isActive: boolean,
        surroundingNum: number
    ) => {
        if (
            (!isActive && surroundingNum === automatonNumber) ||
            (isActive &&
                (surroundingNum === automatonNumber || surroundingNum === automatonNumber - 1))
        ) {
            if (!activePads.includes(pad)) activePads.push(pad);
            if (!isActive) pad.classList.add("active");
            pad.click();
        } else {
            activePads = activePads.filter((item) => item !== pad);
            if (isActive) pad.classList.remove("active");
        }
    };

    /**
     * @function randomMode every note has 1/10 change in playing
     */
    const randomMode = (pad: HTMLDivElement, _padId: number, isActive: boolean) => {
        if (Math.floor(Math.random() * 10) === 0) {
            if (!activePads.includes(pad)) activePads.push(pad);
            if (!isActive) pad.classList.add("active");
            pad.click();
        } else {
            activePads = activePads.filter((item) => item !== pad);
            if (isActive) pad.classList.remove("active");
        }
    };

    /**
     * @function autoPlay start cellular automaton transformations
     */
    const autoPlay = () => {
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
            const surroundingNum = returnSurroundingElements(
                gridSize,
                activePadIds,
                +pad.id
            ).length;

            if (mode === "Mode: Classic") classicMode(pad, padId, isActive, surroundingNum);
            if (mode === "Mode: Random") randomMode(pad, padId, isActive);
        });
        generationController();
    };

    /**
     * @function allPads.forEach grid setup / calculate frequencies associated with each pad
     * @function clickEvent select/de-select pads individually
     *
     * @function playMusic create/start/stop pad oscillator
     */
    allPads.forEach((pad, padId) => {
        const boxNum = gridSize - padId;
        const [padNotes, keyChangeNotes] = calculateNotes(boxNum);
        pad.id = `${boxNum}`;

        pad.addEventListener("click", () => {
            // Select/de-select/preview notes for autoPlay
            if (!isPlaying) {
                if (!activePads.includes(pad)) {
                    activePads.push(pad);
                    pad.classList.add("active");
                    playMusic(padNotes as number);
                } else {
                    activePads = activePads.filter((item) => item !== pad);
                    pad.classList.remove("active");
                }
            }

            if (isPlaying) {
                // Play notes (controlled by autoPlay)
                if (Math.floor(generation / 4) % 2 === 0) playMusic(padNotes as number);
                else playMusic(keyChangeNotes as number);
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
            autoPlay();
            timer = setInterval(() => autoPlay(), speed);
        } else clearInterval(timer);
    });

    /**
     * @event click @function resetState reset automaton
     */
    resetButton?.addEventListener("click", () => {
        resetState();
    });

    /**
     * @event click change mode
     */
    modeButton?.addEventListener("click", () => {
        if (mode === "Mode: Random") mode = "Mode: Classic";
        else mode = "Mode: Random";
        modeButton.innerHTML = mode;
    });
});
