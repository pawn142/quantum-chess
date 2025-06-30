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

	static expanded_lcm(...numbers: number[]): number {
		switch (numbers.length) {
			case 0:
				return 1;
			case 1:
				return numbers[0]!;
			default:
				return Fraction.lcm(numbers[0]!, Fraction.expanded_lcm(...numbers.slice(1)));
		}
	}

	simplify(): Fraction {
		const commonDivisor: number = Fraction.gcd(this.numerator, this.denominator);
		this.numerator /= commonDivisor;
		this.denominator /= commonDivisor;
		if (this.denominator < 0) {
			this.numerator *= -1;
			this.denominator *= -1;
		}
		return this;
	}

	add(other: Fraction): Fraction {
		const commonMultiple: number = Fraction.lcm(this.denominator, other.denominator);
		this.numerator = (this.numerator * (commonMultiple / this.denominator)) + (other.numerator * (commonMultiple / other.denominator));
		this.denominator = commonMultiple;
		return this.simplify();
	}

	multiply(other: Fraction): Fraction {
		this.numerator *= other.numerator;
		this.denominator *= other.denominator;
		return this.simplify();
	}

	static sum(...summands: Fraction[]): Fraction {
		switch (summands.length) {
			case 0:
				return new Fraction(0);
			case 1:
				return new Fraction(summands[0]!.numerator, summands[0]!.denominator);
			case 2:
				return new Fraction(summands[0]!.numerator, summands[0]!.denominator).add(summands[1]!);
			default:
				return Fraction.sum(summands[0]!, Fraction.sum(...summands.slice(1)));
		}
	}

	static product(...factors: Fraction[]): Fraction {
		switch (factors.length) {
			case 0:
				return new Fraction;
			case 1:
				return new Fraction(factors[0]!.numerator, factors[0]!.denominator);
			case 2:
				return new Fraction(factors[0]!.numerator, factors[0]!.denominator).multiply(factors[1]!);
			default:
				return Fraction.product(factors[0]!, Fraction.product(...factors.slice(1)));
		}
	}

	static reciprocal(fraction: Fraction): Fraction {
		return new Fraction(fraction.denominator, fraction.numerator);
	}

	static negative(fraction: Fraction): Fraction {
		return new Fraction(-fraction.numerator, fraction.denominator);
	}

	static difference(fractionOne: Fraction, fractionTwo: Fraction): Fraction {
		return Fraction.sum(fractionOne, Fraction.negative(fractionTwo));
	}

	static quotient(fractionOne: Fraction, fractionTwo: Fraction): Fraction {
		return Fraction.product(fractionOne, Fraction.reciprocal(fractionTwo));
	}

	subtract(other: Fraction): Fraction {
		return this.add(Fraction.negative(other));
	}

	divide(other: Fraction): Fraction {
		return this.multiply(Fraction.reciprocal(other));
	}

	serialize(): string {
		return `${this.numerator}/${this.denominator}`;
	}

	lessThan(other: Fraction): boolean {
		return Fraction.difference(this, other).numerator < 0;
	}

	lessThanOrEqualTo(other: Fraction): boolean {
		return Fraction.difference(this, other).numerator <= 0;
	}

	equalTo(other: Fraction): boolean {
		return Fraction.difference(this, other).numerator === 0;
	}

	value(): number {
		return this.numerator / this.denominator;
	}

	static fractionalClone<T>(obj: T): T {
		if (obj instanceof Fraction) {
			return new Fraction(obj.numerator, obj.denominator) as T;
		} else if (Array.isArray(obj)) {
			return obj.map(element => Fraction.fractionalClone(element)) as T;
		} else if (typeof obj === "object" && obj !== null) {
			return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, Fraction.fractionalClone(value)])) as T;
		} else {
			return obj;
		}
	}
}
