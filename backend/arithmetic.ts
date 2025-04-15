export default class Fraction {
	numerator: number;
	denominator: number;

	static gcd(a: number, b: number): number {
		while (b) {
			[a, b] = [b, a % b];
		}
		return a;
	}

	static lcm(a: number, b: number): number {
		return (a * b) / Fraction.gcd(a, b);
	}

	simplify(): void {
		const commonDivisor: number = Fraction.gcd(this.numerator, this.denominator);
		this.numerator /= commonDivisor;
		this.denominator /= commonDivisor;
	}

	constructor(numeratorCandidate: number, denominatorCandidate: number = 1) {
		if (!denominatorCandidate || !numeratorCandidate) {
			throw new Error("Tried to construct Fraction with a numerator or denominator of 0 or NaN");
    	}
		if (!Number.isInteger(numeratorCandidate) || !Number.isInteger(denominatorCandidate)) {
			throw new Error("Tried to construct Fraction with a non-integer numerator or denominator");
		}
		this.numerator = numeratorCandidate;
		this.denominator = denominatorCandidate;
		this.simplify();
	}

	add(other: Fraction): void {
		const commonMultiple: number = Fraction.lcm(this.numerator, this.denominator);
		this.numerator = (this.numerator * (commonMultiple / this.denominator)) + (other.numerator * (commonMultiple / other.denominator));
		this.denominator = commonMultiple;
		this.simplify();
	}

	multiply(other: Fraction): void {
		this.numerator *= other.numerator;
		this.denominator *= other.denominator;
		this.simplify();
	}

	static reciprocal(fraction: Fraction): Fraction {
		return new Fraction(fraction.denominator, fraction.numerator);
	}

	static negative(fraction: Fraction): Fraction {
		return new Fraction(-fraction.numerator, fraction.denominator);
	}

	serialize(): string {
		return `${this.numerator}/${this.denominator}`;
	}
}
