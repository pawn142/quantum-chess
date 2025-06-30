import Fraction from "./arithmetic.js";
import assert from "assert";

const bitstream: (0 | 1)[] = [];

export function getStream(): (0 | 1)[] {
	return bitstream;
}

export function clear(): void {
	bitstream.length = 0;
}

export function random(limit: number): number {
	assert(Number.isInteger(limit) && limit > 0, "Invalid limit passed into 'random'");
	const stringLength: number = Math.ceil(Math.log2(limit));
	assert(bitstream.length >= stringLength, "Not enough bits in the stream");
	const result: number = stringLength ? parseInt(bitstream.splice(0, stringLength).join(""), 2) : 0;
	return result < limit ? result : random(limit);
}

export function chooseElement<T>(array: T[]): T {
	assert(array.length, "Empty array passed into 'chooseElement'");
	return array[random(array.length)]!;
}

export interface PositionedObject {
	state: {
		probability: Fraction;
	}
}

export function chooseWeightedElement<T>(array: (PositionedObject & T)[]): PositionedObject & T {
	assert(array.length, "Empty array passed into 'chooseWeightedElement'");
	const commonMultiple = Fraction.expanded_lcm(...array.map(element => element.state.probability.denominator));
	let current: number = random(commonMultiple);
	for (const element of array) {
		current -= element.state.probability.numerator * commonMultiple / element.state.probability.denominator;
		if (current < 0)  {
			return element;
		}
	}
	return chooseWeightedElement(array);
}

export function addCustomToStream(values: (0 | 1)[]): void {
	bitstream.push(...values);
}

export function addRandomToStream(numBits: number): void {
	assert(Number.isInteger(numBits) && numBits >= 0, "Invalid amount passed into 'addRandomToStream'");
	const current: (0 | 1)[] = [];
	crypto.getRandomValues(new Uint32Array(Math.ceil(numBits / 32))).forEach(chunk => current.push(...[...chunk.toString(2).padStart(32, "0")].map(Number) as (0 | 1)[]));
	bitstream.push(...current.slice(0, numBits));
}
