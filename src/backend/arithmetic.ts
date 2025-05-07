import assert from "assert";

export default class Fraction {
	numerator: number;
	denominator: number;

	constructor(numeratorCandidate: number = 1, denominatorCandidate: number = 1) {
		assert(Number.isInteger(numeratorCandidate) && Number.isInteger(denominatorCandidate), "Tried to construct Fraction with a non-integer numerator or denominator");
		assert(denominatorCandidate, "Tried to construct Fraction with a denominator of 0");
		this.numerator = numeratorCandidate;
		this.denominator = denominatorCandidate;
		this.simplify();
	}

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
		if (this.denominator < 0) {
			this.numerator *= -1;
			this.denominator *= -1;
		}
	}

	add(other: Fraction): void {
		const commonMultiple: number = Fraction.lcm(this.denominator, other.denominator);
		this.numerator = (this.numerator * (commonMultiple / this.denominator)) + (other.numerator * (commonMultiple / other.denominator));
		this.denominator = commonMultiple;
		this.simplify();
	}

	multiply(other: Fraction): void {
		this.numerator *= other.numerator;
		this.denominator *= other.denominator;
		this.simplify();
	}

	static sum(fracOne: Fraction, fracTwo: Fraction): Fraction {
		const temp: Fraction = new Fraction(fracOne.numerator, fracOne.denominator);
		temp.add(fracTwo);
		return temp;
	}

	static product(fracOne: Fraction, fracTwo: Fraction): Fraction {
		const temp: Fraction = new Fraction(fracOne.numerator, fracOne.denominator);
		temp.multiply(fracTwo);
		return temp;
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

	lessThan(other: Fraction): boolean {
		return Fraction.sum(this, Fraction.negative(other)).numerator < 0;
	}

	lessThanOrEqual(other: Fraction): boolean {
		return Fraction.sum(this, Fraction.negative(other)).numerator <= 0;
	}

	static fractionalClone<T>(object: T & object): T & object {
		if (object instanceof Fraction) {
			return new Fraction(object.numerator, object.denominator) as unknown as T & object;
		} else if (Array.isArray(object)) {
			return object.map(element => Fraction.fractionalClone(element)) as unknown as T & object;
		} else if (typeof object === "object" && object !== null) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, Fraction.fractionalClone(value)])) as unknown as T & object;
		} else {
			return object;
		}
	}
}
