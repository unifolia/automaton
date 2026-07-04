import copyBuffer from "./neurons/copyBuffer";
import calculateNotes from "./neurons/noteCalculator";
import returnSurroundingElements from "./neurons/returnSurroundingElements";

const requireEl = <T extends Element>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Required element not found: ${selector}`);
  return el;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

document.addEventListener("DOMContentLoaded", async () => {
  console.log(
    "%c📻",
    [
      "background: #c1f3cd",
      "font-size: 90px",
      "border: 4px double #ffd166",
      "padding: 50px",
      "transform: scale(11)",
    ].join(";"),
  );

  console.log(
    "We know now that in the early years of the 20th century, this world was being watched closely by intelligences greater than man's and yet as mortal as his own. We know now that as human beings busied themselves about their various concerns, they were scrutinized and studied, perhaps almost as narrowly as a man with a microscope might scrutinize the transient creatures that swarm and multiply in a drop of water. With infinite complacence, people went to and fro over the earth about their little affairs, serene in the assurance of their dominion over this small spinning fragment of solar driftwood which by chance or design man has inherited out of the dark mystery of Time and Space. Yet across an immense ethereal gulf, minds that are to our minds as ours are to the beasts in the jungle, intellects vast, cool and unsympathetic, regarded this earth with envious eyes and slowly and surely drew their plans against us.",
  );

  // Grid/pad info
  type PadArray = HTMLDivElement[];
  const allPads = [...document.querySelectorAll(".pad")] as PadArray;
  let activePads: PadArray = [];
  const grid = requireEl<HTMLElement>(".grid");
  const gridSize = allPads.length;
  const gridSideLength = Math.sqrt(gridSize);
  const gridColumnCount = Number.isInteger(gridSideLength)
    ? gridSideLength
    : gridSize;

  const panForPad = (padId: number) => {
    const visualColumn = gridColumnCount - 1 - (padId % gridColumnCount);

    return clamp(
      (visualColumn / Math.max(1, gridColumnCount - 1)) * 1.6 -
        0.8 +
        (Math.random() - 0.5) * 0.18,
      -0.92,
      0.92,
    );
  };

  // Buttons
  const playButton = requireEl<HTMLButtonElement>(".playButton");
  const resetButton = requireEl<HTMLButtonElement>(".resetButton");
  const modeButton = requireEl<HTMLButtonElement>(".modeButton");
  const aboutButton = requireEl<HTMLButtonElement>(".aboutButton");
  const closeButton = requireEl<HTMLButtonElement>(".closeButton");
  const creditsButton = requireEl<HTMLButtonElement>(".creditsButton");

  // Statistics / settings
  const birthCount = 3;
  const speed = 2500;
  let isPlaying: boolean = false;
  let timer: number;
  let generation: number = 0;
  let generationLog: string[] = [];

  // Play modes
  const classic = "Classic";
  const random = "Random";
  const midiMode = "MIDI";
  const midiAvailable = navigator.requestMIDIAccess !== undefined;
  let currentMode = random;

  // Audio components
  const waveformTypes = ["sawtooth", "sine", "square", "triangle"];
  const impulseResponseUrl = "./resonator.wav";
  let arrayBuffer: ArrayBuffer | undefined;
  let automatonAudioContext: AudioContext;
  let audioContextPromise: Promise<void> | undefined;
  let synthOutputNode: AudioNode | undefined;

  /**
   * @function updateState update elements when isPlaying changes
   */
  const updateState = () => {
    playButton.innerHTML = isPlaying ? "Stop" : "Play";
    grid.className = isPlaying ? "grid playing" : "grid";
    modeButton.className = isPlaying ? "modeButton playing" : "modeButton";
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

  const snapshotActivePads = () => {
    if (activePads.length === 0) return "empty";

    return activePads
      .map((pad) => +pad.id)
      .sort((a, b) => a - b)
      .join(",");
  };

  /**
   * @function generationController compare current pattern to previous pattern, destroy all if plateaued
   */
  const generationController = () => {
    ++generation;
    generationLog.push(snapshotActivePads());

    if (generationLog.length > 2) {
      generationLog.shift();
      const [lastGen, currentGen] = generationLog;

      if (lastGen === currentGen) resetState();
    }
  };

  /**
   * @function handleMIDI allow use of external MIDI controller
   */
  const handleMidi = () => {
    if (navigator.requestMIDIAccess === undefined) return;

    navigator
      .requestMIDIAccess()
      .then((midiAccess: any): void | PromiseLike<void> => {
        type MIDIResponse = { data: [number, number, number?] };

        midiAccess.inputs.forEach(
          (input: any) =>
            (input.onmidimessage = (event: MIDIResponse) => {
              if (event.data.length !== 3 || currentMode !== midiMode) return;

              const pad = allPads[gridSize - (event.data[1] - 35)];
              pad?.click();
            }),
        );
      }, null);
  };

  const loadImpulseResponse = async () => {
    if (arrayBuffer === undefined) {
      const impulseResponse = await fetch(impulseResponseUrl);
      arrayBuffer = await impulseResponse.arrayBuffer();
    }

    return copyBuffer(arrayBuffer.slice(0));
  };

  /**
   * @function createAudioContext create audio context / gain / optional convolver
   */
  const createAudioContext = async () => {
    const AudioCtor =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (AudioCtor === undefined) {
      throw new Error("Web Audio is not available in this browser.");
    }

    automatonAudioContext = new AudioCtor();

    const gainNode = automatonAudioContext.createGain();
    gainNode.gain.value = 0.05; // 😈
    gainNode.connect(automatonAudioContext.destination);

    try {
      const reverb = automatonAudioContext.createConvolver();
      reverb.buffer = await automatonAudioContext.decodeAudioData(
        await loadImpulseResponse(),
      );
      reverb.connect(gainNode);
      synthOutputNode = reverb;
    } catch {
      synthOutputNode = gainNode;
    }

    handleMidi();
  };

  const ensureAudioContext = async () => {
    if (synthOutputNode !== undefined) return;

    if (audioContextPromise === undefined) {
      audioContextPromise = createAudioContext();
    }

    await audioContextPromise;
  };

  /**
   * @function createOscillator create individual oscillator
   */
  const createOscillatorNode = async (i: number, pan: number) => {
    if (synthOutputNode === undefined) return;

    const oscillatorEngine = automatonAudioContext.createOscillator();
    const panner =
      typeof automatonAudioContext.createStereoPanner === "function"
        ? automatonAudioContext.createStereoPanner()
        : undefined;

    oscillatorEngine.type = waveformTypes[
      Math.floor(Math.random() * 4)
    ] as OscillatorType;
    oscillatorEngine.frequency.setValueAtTime(
      i,
      automatonAudioContext.currentTime,
    );

    if (panner !== undefined) {
      panner.pan.setValueAtTime(pan, automatonAudioContext.currentTime);
      oscillatorEngine.connect(panner);
      panner.connect(synthOutputNode);
    } else {
      oscillatorEngine.connect(synthOutputNode);
    }

    oscillatorEngine.start();

    const noteBuffer = new Promise((res) => setTimeout(res, speed));
    await noteBuffer.then(() => {
      oscillatorEngine.stop();
      oscillatorEngine.disconnect();
      panner?.disconnect();
    });
  };

  /**
   * @function padAction
   */
  const padAction = (
    pad: HTMLDivElement,
    currentNotes: number,
    pan: number,
  ) => {
    if (!isPlaying) {
      if (!activePads.includes(pad)) {
        activePads.push(pad);
        pad.classList.add("active");

        createOscillatorNode(currentNotes, pan);
      } else {
        activePads = activePads.filter((item) => item !== pad);
        pad.classList.remove("active");
      }
    }

    if (isPlaying) createOscillatorNode(currentNotes, pan);
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

      ensureAudioContext().then(() =>
        padAction(pad, currentNotes, panForPad(padId)),
      );
    });
  });

  /**
   * @function playClassicMode play notes according to Conway's Game of Life
   */
  const playClassicMode = (
    pad: HTMLDivElement,
    _padId: number,
    isActive: boolean,
    moores: number,
  ) => {
    if (
      (!isActive && moores === birthCount) ||
      (isActive && (moores === birthCount || moores === birthCount - 1))
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
    isActive: boolean,
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
        +pad.id,
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
  playButton.addEventListener("click", async () => {
    await ensureAudioContext();
    isPlaying = !isPlaying;
    updateState();
    setUpAutoPlay();
  });

  resetButton.addEventListener("click", () => {
    resetState();
  });

  modeButton.addEventListener("click", () => {
    ensureAudioContext();

    if (currentMode === classic) {
      currentMode = random;
    } else if (currentMode === random && midiAvailable) {
      currentMode = midiMode;
      document.body.classList.add(midiMode);
    } else {
      currentMode = classic;
      document.body.classList.remove(midiMode);
    }

    modeButton.innerHTML = `Mode: ${currentMode}`;
  });

  aboutButton.addEventListener("click", () => {
    document.querySelector(".modal")?.classList.add("showModal");
  });

  closeButton.addEventListener("click", () => {
    document.querySelector(".modal")?.classList.remove("showModal");
  });

  creditsButton.addEventListener("click", () => {
    const credits = document.querySelector(".credits");
    credits?.classList.toggle("showCredits");

    if (credits?.classList.contains("showCredits") === true) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
});
