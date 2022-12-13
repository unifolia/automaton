import calculateNotes from "./neurons/noteCalculator";
import returnSurroundingElements from "./neurons/returnSurroundingElements";
import playMusic from "./neurons/playMusic";

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
    const speed = 2500;

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
    let arrayBuffer: ArrayBuffer = await response.arrayBuffer();

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
                    playMusic(padNotes as number, arrayBuffer, speed);
                } else {
                    activePads = activePads.filter((item) => item !== pad);
                    pad.classList.remove("active");
                }
            }

            if (isPlaying) {
                // Play notes (controlled by autoPlay)
                if (Math.floor(generation / 4) % 2 === 0)
                    playMusic(padNotes as number, arrayBuffer, speed);
                else playMusic(keyChangeNotes as number, arrayBuffer, speed);
            }
        });
    });

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
     * @functions button click events
     */
    playButton?.addEventListener("click", () => {
        isPlaying = !isPlaying;
        updateState();

        if (isPlaying === true) {
            autoPlay();
            timer = setInterval(() => autoPlay(), speed);
        } else clearInterval(timer);
    });

    resetButton?.addEventListener("click", () => {
        resetState();
    });

    modeButton?.addEventListener("click", () => {
        if (mode === "Mode: Random") mode = "Mode: Classic";
        else mode = "Mode: Random";
        modeButton.innerHTML = mode;
    });
});
