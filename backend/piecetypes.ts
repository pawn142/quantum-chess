import Fraction from './arithmetic.ts';
import { defaultGamePosition, GameData } from './metatypes.ts';

function isObject(candidate: any): boolean {
	return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}

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

export function otherSide(side: keyof typeof Sides): keyof typeof Sides {
	return side === Sides.white ? Sides.black : Sides.white;
}

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
	if (isObject(candidate)) {
		return ['["x","y"]', '["x","y","promotion"]'].includes(JSON.stringify(Object.keys(candidate))) && isPartialCoord(candidate.x) && isPartialCoord(candidate.y) && [...Object.keys(Pieces), undefined].includes(candidate.promotion);
	} else {
		return false;
	}
}

export function areCoordsEqual(coordOne: Coord, coordTwo: Coord): boolean {
	return coordOne.x === coordTwo.x && coordOne.y === coordTwo.y;
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export function discardProbability(coordinate: WeightedCoord): Coord {
	const copy: any = {
		x: coordinate.x,
		y: coordinate.y,
	};
	if ("promotion" in coordinate) {
		copy.promotion = coordinate.promotion;
	}
	return copy;
}

export function addProbability(coordinate: Coord): WeightedCoord {
	const copy: any = structuredClone(coordinate);
	copy.probability = new Fraction;
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
	type_p: keyof typeof Pieces;
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
	position: Coord;
}

export function actualType(completedPiece: CompletedSet): keyof typeof Pieces {
	return completedPiece.position.promotion ?? completedPiece.pieceType.type_p;
}

export interface ObjectPosition {
	objects: ObjectSet[];
	otherData: GameData;
}

export interface CompletedPosition {
	pieces: CompletedSet[];
	otherData?: GameData;
}

export function getPiece(completedPosition: CompletedPosition, coordinate: Coord): CompletedSet | undefined {
	return completedPosition.pieces.find(completedPiece => areCoordsEqual(completedPiece.position, coordinate));
}

export const defaultPosition: CompletedPosition = {
	pieces: [
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 1, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 2, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 3, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 4, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 5, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 6, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 7, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, position: { x: 8, y: 2 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.white }, position: { x: 1, y: 1 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.white }, position: { x: 2, y: 1 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.white }, position: { x: 3, y: 1 } },
		{ pieceType: { type_p: Pieces.queen,  side: Sides.white }, position: { x: 4, y: 1 } },
		{ pieceType: { type_p: Pieces.king,   side: Sides.white }, position: { x: 5, y: 1 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.white }, position: { x: 6, y: 1 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.white }, position: { x: 7, y: 1 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.white }, position: { x: 8, y: 1 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 1, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 2, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 3, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 4, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 5, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 6, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 7, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, position: { x: 8, y: 7 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.black }, position: { x: 1, y: 8 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.black }, position: { x: 2, y: 8 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.black }, position: { x: 3, y: 8 } },
		{ pieceType: { type_p: Pieces.queen,  side: Sides.black }, position: { x: 4, y: 8 } },
		{ pieceType: { type_p: Pieces.king,   side: Sides.black }, position: { x: 5, y: 8 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.black }, position: { x: 6, y: 8 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.black }, position: { x: 7, y: 8 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.black }, position: { x: 8, y: 8 } },
	],
	otherData: defaultGamePosition.otherData!,
} as const;

export function completedPositionToObjects(completedPosition: CompletedPosition): ObjectPosition {
	return {
		objects: completedPosition.pieces.map(completedPiece => ({
			pieceType: structuredClone(completedPiece.pieceType),
			partialPieces: [{
				position: addProbability(completedPiece.position),
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
		for (const objectSet of objectPosition) {
			for (const partialPiece of objectSet.partialPieces) {
				let thisSquare = squareArray[coordToIndex(discardProbability(partialPiece.position))];
				if (thisSquare) {
					throw new Error("Multiple units on the same square in initialization of ChessboardPosition");
				}
				const possibleEntanglementsArray: string[] = objectSet.partialPieces.filter(otherPiece => otherPiece !== partialPiece).map(otherPiece => JSON.stringify(discardProbability(otherPiece.position)));
				if (!partialPiece.entangledTo.every(toCoord => possibleEntanglementsArray.includes(JSON.stringify(toCoord)))) {
					throw new Error("Invalid entanglement to coordinate in initialization of ChessboardPosition");
				}
				thisSquare = {
					ofIndex: pieceArray.length,
					entangledTo: structuredClone(partialPiece.entangledTo),
					promotion: partialPiece.position.promotion,
				};
			}
			pieceArray.push(structuredClone(objectSet.pieceType));
		}
		this.fullPieces = pieceArray;
		this.squares = squareArray;
	}
}

export interface StandardMove {
	start: Coord;
	end: Coord;
}

export function isStandardMove(candidate: any): candidate is StandardMove {
	if (isObject(candidate)) {
		return JSON.stringify(Object.keys(candidate)) === '["start","end"]' && isCoord(candidate.start) && isCoord(candidate.end);
	} else {
		return false;
	}
}
export interface CastleMove {
	side: keyof typeof Sides;
	direction: -1 | 1;
}

export interface Enpassant {
	attackingPawn: Coord;
	captureSquare: Coord;
}

export interface PawnDoubleMove {
	chosenPawn: Coord;
}

export type SpecialMove = CastleMove | Enpassant | PawnDoubleMove;

export const SpecialMoves = {
	castle: "castle",
	enpassant: "enpassant",
	pawnDoubleMove: "pawnDoubleMove",
} as const;

export function getTypeOfMove(move: object): keyof typeof SpecialMoves | false {
	switch (JSON.stringify(Object.keys(move))) {
		case '["side","direction"]':
			return SpecialMoves.castle;
		case '["attackingPawn","captureSquare"]':
			return SpecialMoves.enpassant;
		case '["chosenPawn"]':
			return SpecialMoves.pawnDoubleMove;
		default:
			return false;
	}
}

export type Move = StandardMove | SpecialMove;

export const MoveDeclarations = {
	captureOnly: "captureOnly",
	noCapture: "noCapture",
	checkOnly: "checkOnly",
	noCheck: "noCheck",
	nonLeaping: "nonLeaping",
} as const;

export interface DeclaredMove {
	move: Move;
	declarations: (keyof typeof MoveDeclarations)[];
}

export interface Play {
	pieceIndex: number;
	moves: DeclaredMove[];
}
