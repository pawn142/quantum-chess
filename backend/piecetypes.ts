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
	try {
		return ['["x","y"]', '["x","y","promotion"]'].includes(JSON.stringify(Object.keys(candidate))) && isPartialCoord(candidate.x) && isPartialCoord(candidate.y) && [...Object.keys(Pieces), undefined].includes(candidate.promotion);
	} catch {
		return false;
	}
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export function discardProbability(coordinate: Coord | WeightedCoord): Coord {
	const copy: any = {
		x: coordinate.x,
		y: coordinate.y,
	};
	if ("promotion" in coordinate) {
		copy.promotion = coordinate.promotion;
	}
	return copy;
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

export interface CompletedSet {
	pieceType: ColoredPiece;
	wholePiece: Coord;
}

export interface ObjectPosition {
	objects: ObjectSet[];
	otherData: GameData;
}

export interface CompletedPosition {
	pieces: CompletedSet[];
	otherData?: GameData;
}

export const defaultPosition: CompletedPosition = {
	pieces: [
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 1, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 2, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 3, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 4, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 5, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 6, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 7, y: 2 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.white }, wholePiece: { x: 8, y: 2 } },
		{ pieceType: { name: Pieces.rook,   side: Sides.white }, wholePiece: { x: 1, y: 1 } },
		{ pieceType: { name: Pieces.knight, side: Sides.white }, wholePiece: { x: 2, y: 1 } },
		{ pieceType: { name: Pieces.bishop, side: Sides.white }, wholePiece: { x: 3, y: 1 } },
		{ pieceType: { name: Pieces.queen,  side: Sides.white }, wholePiece: { x: 4, y: 1 } },
		{ pieceType: { name: Pieces.king,   side: Sides.white }, wholePiece: { x: 5, y: 1 } },
		{ pieceType: { name: Pieces.bishop, side: Sides.white }, wholePiece: { x: 6, y: 1 } },
		{ pieceType: { name: Pieces.knight, side: Sides.white }, wholePiece: { x: 7, y: 1 } },
		{ pieceType: { name: Pieces.rook,   side: Sides.white }, wholePiece: { x: 8, y: 1 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 1, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 2, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 3, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 4, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 5, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 6, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 7, y: 7 } },
		{ pieceType: { name: Pieces.pawn,   side: Sides.black }, wholePiece: { x: 8, y: 7 } },
		{ pieceType: { name: Pieces.rook,   side: Sides.black }, wholePiece: { x: 1, y: 8 } },
		{ pieceType: { name: Pieces.knight, side: Sides.black }, wholePiece: { x: 2, y: 8 } },
		{ pieceType: { name: Pieces.bishop, side: Sides.black }, wholePiece: { x: 3, y: 8 } },
		{ pieceType: { name: Pieces.queen,  side: Sides.black }, wholePiece: { x: 4, y: 8 } },
		{ pieceType: { name: Pieces.king,   side: Sides.black }, wholePiece: { x: 5, y: 8 } },
		{ pieceType: { name: Pieces.bishop, side: Sides.black }, wholePiece: { x: 6, y: 8 } },
		{ pieceType: { name: Pieces.knight, side: Sides.black }, wholePiece: { x: 7, y: 8 } },
		{ pieceType: { name: Pieces.rook,   side: Sides.black }, wholePiece: { x: 8, y: 8 } },
	],
	otherData: {
		whoseTurn: Sides.white,
		castling: {
			canWhiteCastle: true,
			canBlackCastle: true,
		},
		enpassant: false,
	},
} as const;

export function completedPositionToObjects(completedPosition: CompletedPosition): ObjectPosition {
	return {
		objects: completedPosition.pieces.map(piece => ({
			pieceType: structuredClone(piece.pieceType),
			partialPieces: [{
				position: {
					x: piece.wholePiece.x,
					y: piece.wholePiece.y,
					probability: new Fraction(1, 1),
				},
				entangledTo: [],
			}]
		})),
		otherData: structuredClone(completedPosition.otherData ?? defaultPosition.otherData)!,
	};
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
				const possibleEntanglementsArray: string[] = object.partialPieces.filter(otherPiece => otherPiece !== partialPiece).map(otherPiece => JSON.stringify(discardProbability(otherPiece.position)));
				if (!partialPiece.entangledTo.every(toCoord => possibleEntanglementsArray.includes(JSON.stringify(toCoord)))) {
					throw new Error("Invalid entanglement coordinate in initialization of ChessboardPosition");
				}
				squareArray[coordToIndex(discardProbability(partialPiece.position))] = {
					ofIndex: pieceArray.length,
					entangledTo: structuredClone(partialPiece.entangledTo),
					promotion: partialPiece.position.promotion,
				};
			}
			pieceArray.push(structuredClone(object.pieceType));
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
