import copyBuffer from "./neurons/copyBuffer";
import calculateNotes from "./neurons/noteCalculator";
import returnSurroundingElements from "./neurons/returnSurroundingElements";

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
  const aboutButton = document.querySelector(".aboutButton");
  const closeButton = document.querySelector(".closeButton");
  const creditsButton = document.querySelector(".creditsButton");

  // Statistics / settings
  const mooreNum = 3;
  const speed = 2500;
  let isPlaying: boolean = false;
  let timer: number;
  let generation: number = 0;
  let generationLog: Array<PadArray> = [];

  // Play modes
  const classic = "Classic";
  const random = "Random";
  let currentMode = random;

  // Audio components
  let waveformTypes = ["sawtooth", "sine", "square", "triangle"];
  let impulseResponse = await fetch(
    `${
      window.location.href.includes("file")
        ? "https://cors-anywhere.herokuapp.com/"
        : ""
    }https://jameslewis.io/assets/wav.wav`
  );
  let arrayBuffer: ArrayBuffer = await impulseResponse.arrayBuffer();
  let automatonAudioContext: AudioContext;
  let reverbNode: ConvolverNode;

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

    activePads.forEach((pad) => pad.classList.remove("active"));

    generation = 0;
    generationLog = [];
    activePads = [];
  };

  /**
   * @function generationController compare current pattern to previous pattern, destroy all if plateaued
   */
  const generationController = () => {
    ++generation;
    generationLog.push(activePads);

    if (generationLog.length > 2) {
      generationLog.shift();

      const [lastGen, currentGen] = generationLog.map((array) => {
        let ids = array.map((div) => div.id);
        if (ids.length > 0)
          return array.map((div) => div.id).reduce((a, b) => a + b);
        return "empty";
      });

      if (lastGen === currentGen) resetState();
    }
  };

  /**
   * @function createAudioContext create audio context / gain / convolver
   */
  const createAudioContext = async () => {
    automatonAudioContext = new window.AudioContext();

    const gainNode = automatonAudioContext.createGain();
    gainNode.gain.value = 0.05; // 😈
    gainNode.connect(automatonAudioContext.destination);

    const reverb = automatonAudioContext.createConvolver();
    const impulseCopy = copyBuffer(arrayBuffer.slice(0));
    reverb.buffer = await automatonAudioContext.decodeAudioData(impulseCopy);
    reverb.connect(gainNode);
    reverbNode = reverb;
  };

  /**
   * @function createOscillator create individual oscillatoir
   */
  const createOscillatorNode = async (i: number) => {
    const oscillatorEngine = automatonAudioContext.createOscillator();

    oscillatorEngine.type = waveformTypes[
      Math.floor(Math.random() * 4)
    ] as OscillatorType;
    oscillatorEngine.frequency.setValueAtTime(
      i,
      automatonAudioContext.currentTime
    );

    oscillatorEngine.connect(reverbNode);
    oscillatorEngine.start();

    const noteBuffer = new Promise((res) => setTimeout(res, speed));
    await noteBuffer.then(() => {
      oscillatorEngine.stop();
      oscillatorEngine.disconnect();
    });
  };

  /**
   * @function padAction
   */
  const padAction = (pad: HTMLDivElement, currentNotes: number) => {
    if (!isPlaying) {
      if (!activePads.includes(pad)) {
        activePads.push(pad);
        pad.classList.add("active");

        createOscillatorNode(currentNotes);
      } else {
        activePads = activePads.filter((item) => item !== pad);
        pad.classList.remove("active");
      }
    }

    if (isPlaying) createOscillatorNode(currentNotes);
  };

  /**
   * @function allPads.forEach grid setup / calculate frequencies associated with each pad
   * @function clickEvent select/de-select pads individually
   */
  allPads.forEach((pad, padId) => {
    const boxNum = gridSize - padId;
    const [padNotes, keyChangeNotes] = calculateNotes(boxNum, gridSize);
    pad.id = `${boxNum}`;

    pad.addEventListener("click", () => {
      const currentNotes =
        Math.floor(generation / 4) % 2 === 0 ? padNotes : keyChangeNotes;

      if (automatonAudioContext === undefined) {
        createAudioContext().then(() => padAction(pad, currentNotes));
      } else padAction(pad, currentNotes);
    });
  });

  /**
   * @function playClassicMode play notes according to Conyway's Game of Life
   */
  const playClassicMode = (
    pad: HTMLDivElement,
    _padId: number,
    isActive: boolean,
    moores: number
  ) => {
    if (
      (!isActive && moores === mooreNum) ||
      (isActive && (moores === mooreNum || moores === mooreNum - 1))
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
   * @function playRandomMode every note has 1/10 change in playing
   */
  const playRandomMode = (
    pad: HTMLDivElement,
    _padId: number,
    isActive: boolean
  ) => {
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
    const activePadIds = activePads.map((activePad) => +activePad.id);

    allPads.forEach((pad, padId) => {
      const isActive = pad.classList.contains("active");
      const surroundingNum = returnSurroundingElements(
        gridSize,
        activePadIds,
        +pad.id
      ).length;

      if (currentMode === classic)
        playClassicMode(pad, padId, isActive, surroundingNum);
      if (currentMode === random) playRandomMode(pad, padId, isActive);
    });
    generationController();
  };

  /**
   * @function setUpAutoPlay setInterval to repeat autoPlay
   */
  const setUpAutoPlay = () => {
    if (isPlaying === true) {
      autoPlay();
      timer = setInterval(() => autoPlay(), speed);
    } else clearInterval(timer);
  };

  /**
   * @functions button click events
   */
  playButton?.addEventListener("click", () => {
    isPlaying = !isPlaying;
    updateState();
    setUpAutoPlay();
  });

  resetButton?.addEventListener("click", () => {
    resetState();
  });

  modeButton?.addEventListener("click", () => {
    if (automatonAudioContext === undefined) {
      createAudioContext();
    }

    if (currentMode === classic) currentMode = random;
    else currentMode = classic;

    modeButton.innerHTML = `Mode: ${currentMode}`;
  });

  aboutButton?.addEventListener("click", () => {
    document.querySelector(".modal")?.classList.add("showModal");
  });

  closeButton?.addEventListener("click", () => {
    document.querySelector(".modal")?.classList.remove("showModal");
  });

  creditsButton?.addEventListener("click", () => {
    const credits = document.querySelector(".credits");
    credits?.classList.toggle("showCredits");

    if (credits?.classList.contains("showCredits") === true) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
});
