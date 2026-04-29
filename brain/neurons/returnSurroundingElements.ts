/**
 * @function returnSurroundingElements return pads surrounding another pad
 * Uses toroidal wrapping so patterns leaving one edge re-enter on the opposite edge.
 */
const returnSurroundingElements = (
  gridSize: number,
  idArray: number[],
  padId: number,
) => {
  const rowLen = Math.sqrt(gridSize);

  if (!Number.isInteger(rowLen)) {
    throw new Error("Grid size must be a perfect square.");
  }

  const activeIds = new Set(idArray);
  const padIndex = padId - 1;
  const row = Math.floor(padIndex / rowLen);
  const column = padIndex % rowLen;
  const offsets = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  return offsets
    .map(([rowOffset, columnOffset]) => {
      const wrappedRow = (row + rowOffset + rowLen) % rowLen;
      const wrappedColumn = (column + columnOffset + rowLen) % rowLen;

      return wrappedRow * rowLen + wrappedColumn + 1;
    })
    .filter((surrounding) => activeIds.has(surrounding));
};

export default returnSurroundingElements;
