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
    const octave = Math.floor(padId / 7 + 2) * 5;

    const modUtility = (id: number) => {
        return id % 7 === 0;
    }

    if (modUtility((padId + 7))) padId = padId + octave;
    else if (modUtility((padId + 6))) padId = padId + octave + 1;
    else if (modUtility((padId + 5))) padId = padId + octave + 2;
    else if (modUtility((padId + 4))) padId = padId + octave + 2;
    else if (modUtility((padId + 3))) padId = padId + octave + 3;
    else if (modUtility((padId + 2))) padId = padId + octave + 4;
    else if (modUtility((padId + 1))) padId = padId + octave + 5;

    return [
        +(tuning * Math.pow(A440, padId)).toFixed(4),
        +(tuning * Math.pow(A440, padId + 3)).toFixed(4),
    ];
};

export default calculateNotes;
