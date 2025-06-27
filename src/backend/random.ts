import assert from "assert";

const bitstream: (0 | 1)[] = [];

export function getStream(): (0 | 1)[] {
	return bitstream;
}

export function clear(): void {
	bitstream.length = 0;
}

export function random(max: number): number {
	assert(Number.isInteger(max) && max > 0, "Invalid max value passed into 'random'");
	const stringLength: number = Math.ceil(Math.log2(max));
	assert(bitstream.length >= stringLength, "Not enough bits in the stream");
	const result: number = stringLength ? parseInt(bitstream.splice(0, stringLength).join(""), 2) : 0;
	return result <= max ? result : random(max);
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
