import assert from "../assert.js";
export default class Fraction {
    numerator;
    denominator;
    constructor(numeratorCandidate = 1, denominatorCandidate = 1) {
        assert(Number.isInteger(numeratorCandidate) && Number.isInteger(denominatorCandidate), "Tried to construct Fraction with a non-integer numerator or denominator");
        assert(denominatorCandidate, "Tried to construct Fraction with a denominator of 0");
        this.numerator = numeratorCandidate;
        this.denominator = denominatorCandidate;
        this.simplify();
    }
    static gcd(a, b) {
        while (b) {
            [a, b] = [b, a % b];
        }
        return a;
    }
    static lcm(a, b) {
        return (a * b) / Fraction.gcd(a, b);
    }
    static expanded_lcm(...numbers) {
        switch (numbers.length) {
            case 0:
                return 1;
            case 1:
                return numbers[0];
            default:
                return Fraction.lcm(numbers[0], Fraction.expanded_lcm(...numbers.slice(1)));
        }
    }
    simplify() {
        const commonDivisor = Fraction.gcd(this.numerator, this.denominator);
        this.numerator /= commonDivisor;
        this.denominator /= commonDivisor;
        if (this.denominator < 0) {
            this.numerator *= -1;
            this.denominator *= -1;
        }
        return this;
    }
    add(other) {
        const commonMultiple = Fraction.lcm(this.denominator, other.denominator);
        this.numerator = (this.numerator * (commonMultiple / this.denominator)) + (other.numerator * (commonMultiple / other.denominator));
        this.denominator = commonMultiple;
        return this.simplify();
    }
    multiply(other) {
        this.numerator *= other.numerator;
        this.denominator *= other.denominator;
        return this.simplify();
    }
    static sum(...summands) {
        switch (summands.length) {
            case 0:
                return new Fraction(0);
            case 1:
                return new Fraction(summands[0].numerator, summands[0].denominator);
            case 2:
                return new Fraction(summands[0].numerator, summands[0].denominator).add(summands[1]);
            default:
                return Fraction.sum(summands[0], Fraction.sum(...summands.slice(1)));
        }
    }
    static product(...factors) {
        switch (factors.length) {
            case 0:
                return new Fraction;
            case 1:
                return new Fraction(factors[0].numerator, factors[0].denominator);
            case 2:
                return new Fraction(factors[0].numerator, factors[0].denominator).multiply(factors[1]);
            default:
                return Fraction.product(factors[0], Fraction.product(...factors.slice(1)));
        }
    }
    static reciprocal(fraction) {
        return new Fraction(fraction.denominator, fraction.numerator);
    }
    static negative(fraction) {
        return new Fraction(-fraction.numerator, fraction.denominator);
    }
    static difference(fractionOne, fractionTwo) {
        return Fraction.sum(fractionOne, Fraction.negative(fractionTwo));
    }
    static quotient(fractionOne, fractionTwo) {
        return Fraction.product(fractionOne, Fraction.reciprocal(fractionTwo));
    }
    subtract(other) {
        return this.add(Fraction.negative(other));
    }
    divide(other) {
        return this.multiply(Fraction.reciprocal(other));
    }
    serialize() {
        return `${this.numerator}/${this.denominator}`;
    }
    lessThan(other) {
        return Fraction.difference(this, other).numerator < 0;
    }
    lessThanOrEqualTo(other) {
        return Fraction.difference(this, other).numerator <= 0;
    }
    equalTo(other) {
        return Fraction.difference(this, other).numerator === 0;
    }
    value() {
        return this.numerator / this.denominator;
    }
    static fractionalClone(obj) {
        if (obj instanceof Fraction) {
            return new Fraction(obj.numerator, obj.denominator);
        }
        else if (Array.isArray(obj)) {
            return obj.map(element => Fraction.fractionalClone(element));
        }
        else if (typeof obj === "object" && obj !== null) {
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, Fraction.fractionalClone(value)]));
        }
        else {
            return obj;
        }
    }
}
