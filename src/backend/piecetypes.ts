import Fraction from './arithmetic.js';
import assert from 'assert';

export function isObject(candidate: any): boolean {
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

export const validPromotions: Set<keyof typeof Pieces | undefined> = new Set([
	Pieces.knight,
	Pieces.bishop,
	Pieces.rook,
	Pieces.queen,
	undefined
]);

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

export function discardPromotion(coord: Coord): Coord {
	return {
		x: coord.x,
		y: coord.y,
	};
}

export function isCoord(candidate: any): candidate is Coord {
	return isObject(candidate) ? isPartialCoord(candidate.x) && isPartialCoord(candidate.y) && validPromotions.has(candidate.promotion) : false;
}

export function areCoordsEqual(coordOne: Coord, coordTwo: Coord): boolean {
	return coordOne.x === coordTwo.x && coordOne.y === coordTwo.y;
}

export function translateCoord(coord: Coord, x_amount: number = 0, y_amount: number = 0, makeCopy: boolean = false): Coord {
	const newCoord: Coord = makeCopy ? Fraction.fractionalClone(coord) : coord;
	newCoord.x += x_amount;
	newCoord.y += y_amount;
	assert(isCoord(newCoord), "Invalid translation passed into 'translateCoord'");
	return newCoord;
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export function discardProbability(coord: WeightedCoord): Coord {
	const copy: any = {
		x: coord.x,
		y: coord.y,
	};
	if ("promotion" in coord) {
		copy.promotion = coord.promotion;
	}
	return copy;
}

export function addProbability(coord: Coord): WeightedCoord {
	const copy: any = structuredClone(coord);
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
	state: WeightedCoord;
	entangledTo: Coord[];
}

export interface IndexedPiece {
	ofIndex: number;
	entangledTo: Coord[];
	promotion?: keyof typeof Pieces;
}

export interface ObjectSet {
	pieceType: ColoredPiece;
	units: PositionedPiece[];
}

export interface CompletedSet {
	pieceType: ColoredPiece;
	state: Coord;
}

export function actualType(completedPiece: CompletedSet): keyof typeof Pieces {
	return completedPiece.state.promotion ?? completedPiece.pieceType.type_p;
}

export interface GameData {
	whoseTurn: keyof typeof Sides;
	castling: {
		canWhiteCastleLeft: boolean;
		canWhiteCastleRight: boolean;
		canBlackCastleLeft: boolean;
		canBlackCastleRight: boolean;
	};
	enpassant: Coord | false;
	qubits: {
		whiteBalance: number;
		blackBalance: number;
	}
}

export const defaultData: GameData = {
	whoseTurn: Sides.white,
	castling: {
		canWhiteCastleLeft: true,
		canWhiteCastleRight: true,
		canBlackCastleLeft: true,
		canBlackCastleRight: true,
	},
	enpassant: false,
	qubits: {
		whiteBalance: 0,
		blackBalance: 0,
	}
};

export function getRespectiveQubitAmount(data: GameData): number {
	return data.whoseTurn === Sides.white ? data.qubits.whiteBalance : data.qubits.blackBalance;
}

export interface ObjectPosition {
	objects: ObjectSet[];
	otherData: GameData;
}

export function findUnit(objects: ObjectSet[], coord: Coord): PositionedPiece | undefined {
	return objects.flatMap(objectSet => objectSet.units).find(unit => areCoordsEqual(unit.state, coord));
}

export function findObject(quantumPos: ObjectPosition, coord: Coord): ObjectSet | undefined {
	return quantumPos.objects.find(objectSet => objectSet.units.some(unit => areCoordsEqual(unit.state, coord)));
}

export function getCoordType(quantumPos: ObjectPosition, coord: Coord): keyof typeof Pieces | undefined {
	return findUnit(quantumPos.objects, coord)?.state.promotion ?? findObject(quantumPos, coord)?.pieceType.type_p;
}

export function findObjectFromType(quantumPos: ObjectPosition, rawType: keyof typeof Pieces, side: keyof typeof Sides): ObjectSet | undefined {
	return quantumPos.objects.find(objectSet => objectSet.pieceType.type_p === rawType && objectSet.pieceType.side === side);
}

export function areOfDifferentObjects(quantumPos: ObjectPosition, coordOne: Coord, coordTwo: Coord): boolean {
	return ((objectOne, objectTwo) => !!objectOne && !!objectTwo && objectOne !== objectTwo)(findObject(quantumPos, coordOne), findObject(quantumPos, coordTwo));
}

export interface CompletedPosition {
	pieces: CompletedSet[];
	otherData?: GameData;
}

export function findPiece(completedPos: CompletedPosition, coord: Coord): CompletedSet | undefined {
	return completedPos.pieces.find(completedPiece => areCoordsEqual(completedPiece.state, coord));
}

export function findPieceFromType(completedPos: CompletedPosition, rawType: keyof typeof Pieces, side: keyof typeof Sides): CompletedSet | undefined {
	return completedPos.pieces.find(completedPiece => completedPiece.pieceType.type_p === rawType && completedPiece.pieceType.side === side);
}

export const defaultPosition: CompletedPosition = {
	pieces: [
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 1, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 2, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 3, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 4, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 5, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 6, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 7, y: 2 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.white }, state: { x: 8, y: 2 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.white }, state: { x: 1, y: 1 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.white }, state: { x: 2, y: 1 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.white }, state: { x: 3, y: 1 } },
		{ pieceType: { type_p: Pieces.queen,  side: Sides.white }, state: { x: 4, y: 1 } },
		{ pieceType: { type_p: Pieces.king,   side: Sides.white }, state: { x: 5, y: 1 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.white }, state: { x: 6, y: 1 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.white }, state: { x: 7, y: 1 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.white }, state: { x: 8, y: 1 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 1, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 2, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 3, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 4, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 5, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 6, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 7, y: 7 } },
		{ pieceType: { type_p: Pieces.pawn,   side: Sides.black }, state: { x: 8, y: 7 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.black }, state: { x: 1, y: 8 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.black }, state: { x: 2, y: 8 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.black }, state: { x: 3, y: 8 } },
		{ pieceType: { type_p: Pieces.queen,  side: Sides.black }, state: { x: 4, y: 8 } },
		{ pieceType: { type_p: Pieces.king,   side: Sides.black }, state: { x: 5, y: 8 } },
		{ pieceType: { type_p: Pieces.bishop, side: Sides.black }, state: { x: 6, y: 8 } },
		{ pieceType: { type_p: Pieces.knight, side: Sides.black }, state: { x: 7, y: 8 } },
		{ pieceType: { type_p: Pieces.rook,   side: Sides.black }, state: { x: 8, y: 8 } },
	],
	otherData: structuredClone(defaultData),
} as const;

export function completedPositionToObjects(completedPos: CompletedPosition): ObjectPosition {
	return {
		objects: completedPos.pieces.map(completedPiece => ({
			pieceType: structuredClone(completedPiece.pieceType),
			units: [{
				state: addProbability(completedPiece.state),
				entangledTo: [],
			}]
		})),
		otherData: structuredClone(completedPos.otherData ?? defaultData),
	};
}

export function objectsToFilledPosition(quantumPos: ObjectPosition): CompletedPosition {
	return {
		pieces: quantumPos.objects.flatMap(objectSet => objectSet.units.map(unit => ({
			pieceType: structuredClone(objectSet.pieceType),
			state: discardProbability(unit.state),
		}))),
		otherData: structuredClone(quantumPos.otherData),
	};
}

export function objectsToSparsePosition(quantumPos: ObjectPosition): CompletedPosition {
	return {
		pieces: quantumPos.objects.flatMap(objectSet => objectSet.units.filter(unit => unit.state.probability.equalTo(new Fraction)).map(unit => ({
			pieceType: structuredClone(objectSet.pieceType),
			state: discardProbability(unit.state),
		}))),
		otherData: structuredClone(quantumPos.otherData),
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

export function coordToIndex(coord: Coord): number {
	assert(isCoord(coord), "Invalid coordinate passed into 'coordToIndex'");
	return 63 + coord.x - 8 * coord.y;
}

export function indexToCoord(index: number): Coord {
	assert(Number.isInteger(index) && 0 <= index && index < 64, "Invalid index passed into 'indexToCoord'");
	return {
		x: index % 8 + 1 as PartialCoord,
		y: 8 - Math.floor(index / 8) as PartialCoord,
	};
}

export class ChessboardPosition {
	fullPieces: ColoredPiece[];
	squares: FullBoard;

	constructor(objectPosition: ObjectSet[]) {
		const currentPieces: ColoredPiece[] = [];
		const currentSquares: FullBoard = Array(64).fill(undefined) as FullBoard;
		for (const objectSet of objectPosition) {
			for (const unit of objectSet.units) {
				const squareIndex = coordToIndex(discardProbability(unit.state));
				const possibleEntanglements: Set<string> = new Set(objectSet.units.filter(otherPiece => otherPiece !== unit).map(otherPiece => JSON.stringify(discardProbability(otherPiece.state))));
				assert(currentSquares[squareIndex] === undefined, "Multiple units on the same square in initialization of ChessboardPosition");
				assert(unit.entangledTo.every(toCoord => possibleEntanglements.has(JSON.stringify(toCoord))), "Invalid entanglement to-coordinate in initialization of ChessboardPosition");
				currentSquares[squareIndex] = {
					ofIndex: currentPieces.length,
					entangledTo: structuredClone(unit.entangledTo),
					promotion: unit.state.promotion,
				};
			}
			currentPieces.push(structuredClone(objectSet.pieceType));
		}
		this.fullPieces = currentPieces;
		this.squares = currentSquares;
	}
}

export interface StandardMove {
	start: Coord;
	end: Coord;
}

export function isStandardMove(candidate: any, permissive: boolean = false): candidate is StandardMove {
	return isObject(candidate) ? isCoord(candidate.start) && isCoord(candidate.end) && (permissive || candidate.start.promotion === undefined) : false;
}
export interface CastleMove {
	side: keyof typeof Sides;
	direction: -1 | 1;
}

export function getCastleProperty(castleMove: CastleMove): "canWhiteCastleRight" | "canBlackCastleRight" | "canWhiteCastleLeft" | "canBlackCastleLeft" {
	return castleMove.direction === 1 ? castleMove.side === Sides.white ? "canWhiteCastleRight" : "canBlackCastleRight" : castleMove.side ? "canWhiteCastleLeft" : "canBlackCastleLeft";
}

export interface Enpassant {
	attackingPawn: Coord;
	captureSquare: Coord;
}

export function enpassantDisplacement(side: keyof typeof Sides): number {
	return side === Sides.white ? 1 : -1;
}

export interface PawnDoubleMove {
	pushedPawn: Coord;
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
		case '["pushedPawn"]':
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
	declarations: Set<keyof typeof MoveDeclarations>;
}

export const allDeclarations: Set<keyof typeof MoveDeclarations> = new Set(Object.keys(MoveDeclarations)) as Set<keyof typeof MoveDeclarations>;

export interface Play {
	objectIndex: number;
	primaryMoves: DeclaredMove[];
	defaultMoves: DeclaredMove[];
}
