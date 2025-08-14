import Fraction from "./arithmetic.js";
import assert from "../assert.js";
const bitstream = [];
export function getStream() {
    return bitstream;
}
export function clear() {
    bitstream.length = 0;
}
export function random(limit) {
    assert(Number.isInteger(limit) && limit > 0, "Invalid limit passed into 'random'");
    const stringLength = Math.ceil(Math.log2(limit));
    assert(bitstream.length >= stringLength, "Not enough bits in the stream");
    const result = stringLength ? parseInt(bitstream.splice(0, stringLength).join(""), 2) : 0;
    return result < limit ? result : random(limit);
}
export function chooseElement(array) {
    assert(array.length, "Empty array passed into 'chooseElement'");
    return array[random(array.length)];
}
export function chooseWeightedElement(array) {
    assert(array.length, "Empty array passed into 'chooseWeightedElement'");
    const commonMultiple = Fraction.expanded_lcm(...array.map(element => element.state.probability.denominator));
    let current = random(commonMultiple);
    for (const element of array) {
        current -= element.state.probability.numerator * commonMultiple / element.state.probability.denominator;
        if (current < 0) {
            return element;
        }
    }
    return chooseWeightedElement(array);
}
export function addCustomToStream(values) {
    bitstream.push(...values);
}
export function addRandomToStream(numBits) {
    assert(Number.isInteger(numBits) && numBits >= 0, "Invalid amount passed into 'addRandomToStream'");
    const current = [];
    crypto.getRandomValues(new Uint32Array(Math.ceil(numBits / 32))).forEach(chunk => current.push(...[...chunk.toString(2).padStart(32, "0")].map(Number)));
    bitstream.push(...current.slice(0, numBits));
}
