/**
 * @function copyBuffer @returns true copy of impulse response array buffer
 */
const copyBuffer = (buffer: ArrayBuffer) => {
    let copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buffer));
    return copy;
};

export default copyBuffer;
