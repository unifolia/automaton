/**
 * @function returnSurroundingElements return pads surrounding another pad
 * Now supports 6×6 grid (36 pads total)
 */
const returnSurroundingElements = (gridSize: number, idArray: number[], padId: number) => {
    // For 36 pads: 6 rows × 6 columns (perfect square)
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
