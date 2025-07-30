"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // brain/neurons/copyBuffer.ts
  var copyBuffer, copyBuffer_default;
  var init_copyBuffer = __esm({
    "brain/neurons/copyBuffer.ts"() {
      "use strict";
      copyBuffer = (buffer) => {
        let copy = new ArrayBuffer(buffer.byteLength);
        new Uint8Array(copy).set(new Uint8Array(buffer));
        return copy;
      };
      copyBuffer_default = copyBuffer;
    }
  });

  // brain/neurons/noteCalculator.ts
  var calculateNotes, noteCalculator_default;
  var init_noteCalculator = __esm({
    "brain/neurons/noteCalculator.ts"() {
      "use strict";
      calculateNotes = (padId, keyOffset = 0, modeIndex = 0) => {
        const A440 = 440;
        const semitone = Math.pow(2, 1 / 12);
        const scales = {
          major: [0, 2, 4, 5, 7, 9, 11],
          minor: [0, 2, 3, 5, 7, 8, 10],
          dorian: [0, 2, 3, 5, 7, 9, 10],
          mixolydian: [0, 2, 4, 5, 7, 9, 10],
          pentatonic: [0, 2, 4, 7, 9],
          blues: [0, 3, 5, 6, 7, 10]
        };
        const scaleNames = Object.keys(scales);
        const scaleKey = modeIndex < scaleNames.length ? scaleNames[modeIndex] : "major";
        const currentScale = scales[scaleKey];
        const scaleLength = currentScale.length;
        const padIndex = padId - 1;
        const scalePosition = padIndex % scaleLength;
        const octaveOffset = Math.floor(padIndex / scaleLength);
        const rootNote = 60 + keyOffset;
        const scaleNote = rootNote + currentScale[scalePosition] + octaveOffset * 12;
        const baseFreq = A440 * Math.pow(semitone, scaleNote - 90);
        return [+baseFreq.toFixed(4)];
      };
      noteCalculator_default = calculateNotes;
    }
  });

  // brain/neurons/returnSurroundingElements.ts
  var returnSurroundingElements, returnSurroundingElements_default;
  var init_returnSurroundingElements = __esm({
    "brain/neurons/returnSurroundingElements.ts"() {
      "use strict";
      returnSurroundingElements = (gridSize, idArray, padId) => {
        const rowLen = Math.sqrt(gridSize);
        const al = padId + rowLen - 1;
        const a = padId + rowLen;
        const ar = padId + rowLen + 1;
        const l = padId - 1;
        const r = padId + 1;
        const bl = padId - rowLen - 1;
        const b = padId - rowLen;
        const br = padId - rowLen + 1;
        return [al, a, ar, l, r, bl, b, br].map((surrounding) => {
          return idArray.includes(surrounding);
        }).filter((isActive) => isActive !== false);
      };
      returnSurroundingElements_default = returnSurroundingElements;
    }
  });

  // brain/brain.ts
  var require_brain = __commonJS({
    "brain/brain.ts"(exports) {
      init_copyBuffer();
      init_noteCalculator();
      init_returnSurroundingElements();
      document.addEventListener("DOMContentLoaded", () => __async(exports, null, function* () {
        const allPads = [...document.querySelectorAll(".pad")];
        let activePads = [];
        const grid = document.querySelector(".grid");
        const gridSize = allPads.length;
        const playButton = document.querySelector(".playButton");
        const resetButton = document.querySelector(".resetButton");
        const modeButton = document.querySelector(".modeButton");
        const aboutButton = document.querySelector(".aboutButton");
        const closeButton = document.querySelector(".closeButton");
        const creditsButton = document.querySelector(".creditsButton");
        const mooreNum = 3;
        const speed = 2500;
        let isPlaying = false;
        let timer;
        let generation = 0;
        let generationLog = [];
        let currentKey = 0;
        let musicalMode = 0;
        const classic = "Classic";
        const random = "Random";
        let currentMode = random;
        let waveformTypes = ["sawtooth", "sine", "square", "triangle"];
        let impulseResponse = yield fetch(
          `${window.location.href.includes("localhost") ? "https://cors-anywhere.herokuapp.com/" : ""}https://jameslewis.io/assets/wav.wav`
        );
        let arrayBuffer = yield impulseResponse.arrayBuffer();
        let automatonAudioContext;
        let reverbNode;
        const updateState = () => {
          playButton.innerHTML = isPlaying ? "Stop" : "Play";
          grid.className = isPlaying ? "main grid playing" : "main grid";
          modeButton.className = isPlaying ? "modeButton playing" : "modeButton";
        };
        const resetState = () => {
          isPlaying = false;
          clearInterval(timer);
          updateState();
          activePads.forEach((pad) => pad.classList.remove("active"));
          generation = 0;
          generationLog = [];
          activePads = [];
        };
        const musicalProgressionController = () => {
          if (generation % 8 === 0 && generation > 0) {
            const keyProgression = [0, 7, 2, 9, 4, 11, 6, 1];
            currentKey = keyProgression[Math.floor(generation / 8) % keyProgression.length];
          }
          if (generation % 4 === 0 && generation > 0) {
            musicalMode = (musicalMode + 1) % 3;
          }
        };
        const generationController = () => {
          ++generation;
          generationLog.push(activePads);
          musicalProgressionController();
          if (generationLog.length > 2) {
            generationLog.shift();
            const [lastGen, currentGen] = generationLog.map((array) => {
              let ids = array.map((div) => div.id);
              if (ids.length > 0)
                return array.map((div) => div.id).reduce((a, b) => a + b);
              return "empty";
            });
            if (lastGen === currentGen)
              resetState();
          }
        };
        const createAudioContext = () => __async(exports, null, function* () {
          automatonAudioContext = new window.AudioContext();
          const gainNode = automatonAudioContext.createGain();
          gainNode.gain.value = 0.05;
          gainNode.connect(automatonAudioContext.destination);
          const reverb = automatonAudioContext.createConvolver();
          const impulseCopy = copyBuffer_default(arrayBuffer.slice(0));
          reverb.buffer = yield automatonAudioContext.decodeAudioData(impulseCopy);
          reverb.connect(gainNode);
          reverbNode = reverb;
        });
        const createOscillatorNode = (i) => __async(exports, null, function* () {
          const oscillatorEngine = automatonAudioContext.createOscillator();
          oscillatorEngine.type = waveformTypes[Math.floor(Math.random() * 4)];
          oscillatorEngine.frequency.setValueAtTime(
            i,
            automatonAudioContext.currentTime
          );
          oscillatorEngine.connect(reverbNode);
          oscillatorEngine.start();
          const noteBuffer = new Promise((res) => setTimeout(res, speed));
          yield noteBuffer.then(() => {
            oscillatorEngine.stop();
            oscillatorEngine.disconnect();
          });
        });
        const padAction = (pad, currentNotes) => {
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
          if (isPlaying)
            createOscillatorNode(currentNotes);
        };
        allPads.forEach((pad, padId) => {
          const boxNum = gridSize - padId;
          pad.id = `${boxNum}`;
          pad.addEventListener("click", () => {
            const [padNotes] = noteCalculator_default(boxNum, currentKey, musicalMode);
            if (automatonAudioContext === void 0) {
              createAudioContext().then(() => padAction(pad, padNotes));
            } else
              padAction(pad, padNotes);
          });
        });
        const playClassicMode = (pad, _padId, isActive, moores) => {
          if (!isActive && moores === mooreNum || isActive && (moores === mooreNum || moores === mooreNum - 1)) {
            if (!activePads.includes(pad))
              activePads.push(pad);
            if (!isActive)
              pad.classList.add("active");
            pad.click();
          } else {
            activePads = activePads.filter((item) => item !== pad);
            if (isActive)
              pad.classList.remove("active");
          }
        };
        const playRandomMode = (pad, _padId, isActive) => {
          if (Math.floor(Math.random() * 6) === 0) {
            if (!activePads.includes(pad))
              activePads.push(pad);
            if (!isActive)
              pad.classList.add("active");
            pad.click();
          } else {
            activePads = activePads.filter((item) => item !== pad);
            if (isActive)
              pad.classList.remove("active");
          }
        };
        const autoPlay = () => {
          const activePadIds = activePads.map((activePad) => +activePad.id);
          allPads.forEach((pad, padId) => {
            const isActive = pad.classList.contains("active");
            const surroundingNum = returnSurroundingElements_default(
              gridSize,
              activePadIds,
              +pad.id
            ).length;
            if (currentMode === classic)
              playClassicMode(pad, padId, isActive, surroundingNum);
            if (currentMode === random)
              playRandomMode(pad, padId, isActive);
          });
          generationController();
        };
        const setUpAutoPlay = () => {
          if (isPlaying === true) {
            autoPlay();
            timer = setInterval(() => autoPlay(), speed);
          } else
            clearInterval(timer);
        };
        playButton == null ? void 0 : playButton.addEventListener("click", () => {
          isPlaying = !isPlaying;
          updateState();
          setUpAutoPlay();
        });
        resetButton == null ? void 0 : resetButton.addEventListener("click", () => {
          resetState();
        });
        modeButton == null ? void 0 : modeButton.addEventListener("click", () => {
          if (automatonAudioContext === void 0) {
            createAudioContext();
          }
          if (currentMode === classic)
            currentMode = random;
          else
            currentMode = classic;
          modeButton.innerHTML = `Mode: ${currentMode}`;
        });
        aboutButton == null ? void 0 : aboutButton.addEventListener("click", () => {
          var _a;
          (_a = document.querySelector(".modal")) == null ? void 0 : _a.classList.add("showModal");
        });
        closeButton == null ? void 0 : closeButton.addEventListener("click", () => {
          var _a;
          (_a = document.querySelector(".modal")) == null ? void 0 : _a.classList.remove("showModal");
        });
        creditsButton == null ? void 0 : creditsButton.addEventListener("click", () => {
          const credits = document.querySelector(".credits");
          credits == null ? void 0 : credits.classList.toggle("showCredits");
          if ((credits == null ? void 0 : credits.classList.contains("showCredits")) === true) {
            window.scrollTo(0, document.body.scrollHeight);
          }
        });
      }));
    }
  });
  require_brain();
})();
