import Fraction from './arithmetic.ts';
import { GameData } from './metatypes.ts';

export const Pieces = {
	pawn: "pawn",
	knight: "knight",
	bishop: "bishop",
	rook: "rook",
	queen: "queen",
	king: "king",
} as const;

export const Sides = {
	white: "white",
	black: "black",
} as const;

export type PartialCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isPartialCoord(candidate: number): candidate is PartialCoord {
	return Number.isInteger(candidate) && 0 < candidate && candidate <= 8;
}

export interface Coord {
	x: PartialCoord;
	y: PartialCoord;
	promotion?: keyof typeof Pieces;
}

export function isCoord(candidate: any): candidate is Coord {
	return [["x", "y"], ["x", "y", "promotion"]].includes(Object.keys(candidate)) && isPartialCoord(candidate.x) && isPartialCoord(candidate.y) && [...Object.keys(Pieces), undefined].includes(candidate.promotion);
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export function discardProbability(weightedCoord: WeightedCoord): Coord {
	return {
		x: weightedCoord.x,
		y: weightedCoord.y,
	};
}

export const chessboard: Coord[] = [
	{ x: 1, y: 1 },
	{ x: 2, y: 1 },
	{ x: 3, y: 1 },
	{ x: 4, y: 1 },
	{ x: 5, y: 1 },
	{ x: 6, y: 1 },
	{ x: 7, y: 1 },
	{ x: 8, y: 1 },
	{ x: 1, y: 2 },
	{ x: 2, y: 2 },
	{ x: 3, y: 2 },
	{ x: 4, y: 2 },
	{ x: 5, y: 2 },
	{ x: 6, y: 2 },
	{ x: 7, y: 2 },
	{ x: 8, y: 2 },
	{ x: 1, y: 3 },
	{ x: 2, y: 3 },
	{ x: 3, y: 3 },
	{ x: 4, y: 3 },
	{ x: 5, y: 3 },
	{ x: 6, y: 3 },
	{ x: 7, y: 3 },
	{ x: 8, y: 3 },
	{ x: 1, y: 4 },
	{ x: 2, y: 4 },
	{ x: 3, y: 4 },
	{ x: 4, y: 4 },
	{ x: 5, y: 4 },
	{ x: 6, y: 4 },
	{ x: 7, y: 4 },
	{ x: 8, y: 4 },
	{ x: 1, y: 5 },
	{ x: 2, y: 5 },
	{ x: 3, y: 5 },
	{ x: 4, y: 5 },
	{ x: 5, y: 5 },
	{ x: 6, y: 5 },
	{ x: 7, y: 5 },
	{ x: 8, y: 5 },
	{ x: 1, y: 6 },
	{ x: 2, y: 6 },
	{ x: 3, y: 6 },
	{ x: 4, y: 6 },
	{ x: 5, y: 6 },
	{ x: 6, y: 6 },
	{ x: 7, y: 6 },
	{ x: 8, y: 6 },
	{ x: 1, y: 7 },
	{ x: 2, y: 7 },
	{ x: 3, y: 7 },
	{ x: 4, y: 7 },
	{ x: 5, y: 7 },
	{ x: 6, y: 7 },
	{ x: 7, y: 7 },
	{ x: 8, y: 7 },
	{ x: 1, y: 8 },
	{ x: 2, y: 8 },
	{ x: 3, y: 8 },
	{ x: 4, y: 8 },
	{ x: 5, y: 8 },
	{ x: 6, y: 8 },
	{ x: 7, y: 8 },
	{ x: 8, y: 8 },
] as const;

export interface ColoredPiece {
	name: keyof typeof Pieces;
	side: keyof typeof Sides;
}

export interface PositionedPiece {
	position: WeightedCoord;
	entangledTo: Coord[];
}

export interface IndexedPiece {
	ofIndex: number;
	entangledTo: Coord[];
	promotion?: keyof typeof Pieces;
}

export interface ObjectSet {
	pieceType: ColoredPiece;
	partialPieces: PositionedPiece[];
}

export interface ObjectPosition {
	objects: ObjectSet[];
	otherData: GameData;
}

export type OptionalPiece = IndexedPiece | undefined;

export type FullBoard = [OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                         OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece, OptionalPiece,
                        ];

export function coordToIndex(coordinate: Coord): number {
	if (isCoord(coordinate)) {
		return 63 + coordinate.x - 8 * coordinate.y;
	} else {
		throw new Error("Invalid coordinate passed into 'coordToIndex'");
	}
}

export function indexToCoord(index: number): Coord {
	if (Number.isInteger(index) && 0 <= index && index < 64) {
		return {
			x: index % 8 + 1 as PartialCoord,
			y: 8 - Math.floor(index / 8) as PartialCoord,
		};
	} else {
		throw new Error("Invalid index passed into 'indexToCoord'");
	}
}

export class ChessboardPosition {
	fullPieces: ColoredPiece[];
	squares: FullBoard;
	constructor(objectPosition: ObjectSet[]) {
		const pieceArray: ColoredPiece[] = [];
		const squareArray: FullBoard = Array(64).fill(undefined) as FullBoard;
		for (const object of objectPosition) {
			for (const partialPiece of object.partialPieces) {
				if (squareArray[coordToIndex(discardProbability(partialPiece.position))]) {
					throw new Error("Multiple units on the same square in initialization of ChessboardPosition");
				}
				squareArray[coordToIndex(discardProbability(partialPiece.position))] = {
					ofIndex: pieceArray.length,
					entangledTo: structuredClone(partialPiece.entangledTo),
					promotion: partialPiece.position.promotion,
				};
			}
			pieceArray.push(object.pieceType);
		}
		this.fullPieces = pieceArray;
		this.squares = squareArray;
	}
}

export interface Move {
	start: Coord;
	end: Coord;
}

export interface PieceMove {
	piece: keyof typeof Pieces;
	move: Move;
}
