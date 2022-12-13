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

export default returnSurroundingElements;
