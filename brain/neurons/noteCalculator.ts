/**
 * @function calculateNotes determines what note to play for @param padId pad
 * @returns [frequency to play, KEY CHANGE frequency to play]
 *
 * @description: I never want to do this math ever again
 */
const calculateNotes = (padId: number, gridSize: number) => {
    const rowLen = Math.sqrt(gridSize);

    const tuning = 440;
    const A440 = Math.pow(2, 1 / 12);
    const row = Math.floor((padId - 1) / rowLen) + 1;
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
        // ^ minor third key change / Bb Major
        +(tuning * Math.pow(A440, padId + 3)).toFixed(4),
    ];
};

export default calculateNotes;
