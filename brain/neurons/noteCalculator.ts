/*
 * @function calculateNotes determines what note to play for @param padId pad
 * @returns [frequency to play, harmonic progression frequency to play]
 */
const calculateNotes = (
  padId: number,
  keyOffset: number = 0,
  modeIndex: number = 0
) => {
  const A440 = 440;
  const semitone = Math.pow(2, 1 / 12);

  const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
  };

  const scaleNames = Object.keys(scales);
  const scaleKey =
    modeIndex < scaleNames.length ? scaleNames[modeIndex] : "major";
  const currentScale = scales[scaleKey as keyof typeof scales];

  const scaleLength = currentScale.length;
  const padIndex = padId - 1;

  const scalePosition = padIndex % scaleLength;
  const octaveOffset = Math.floor(padIndex / scaleLength); // How many octaves up

  const rootNote = 60 + keyOffset;
  const scaleNote = rootNote + currentScale[scalePosition] + octaveOffset * 12;
  const baseFreq = A440 * Math.pow(semitone, scaleNote - 90);

  return [+baseFreq.toFixed(4)];
};

export default calculateNotes;
