export default function assert(condition: any, errorMessage: string): void {
	if (!condition) {
		throw new Error(errorMessage);
	}
}
