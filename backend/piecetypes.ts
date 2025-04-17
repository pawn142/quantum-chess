import Fraction from './arithmetic.ts';

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

export interface Coord {
	x: PartialCoord;
	y: PartialCoord;
	promotion?: keyof typeof Pieces;
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export const chessboard: Coord[] = [
	{x: 1, y: 1},
	{x: 2, y: 1},
	{x: 3, y: 1},
	{x: 4, y: 1},
	{x: 5, y: 1},
	{x: 6, y: 1},
	{x: 7, y: 1},
	{x: 8, y: 1},
	{x: 1, y: 2},
	{x: 2, y: 2},
	{x: 3, y: 2},
	{x: 4, y: 2},
	{x: 5, y: 2},
	{x: 6, y: 2},
	{x: 7, y: 2},
	{x: 8, y: 2},
	{x: 1, y: 3},
	{x: 2, y: 3},
	{x: 3, y: 3},
	{x: 4, y: 3},
	{x: 5, y: 3},
	{x: 6, y: 3},
	{x: 7, y: 3},
	{x: 8, y: 3},
	{x: 1, y: 4},
	{x: 2, y: 4},
	{x: 3, y: 4},
	{x: 4, y: 4},
	{x: 5, y: 4},
	{x: 6, y: 4},
	{x: 7, y: 4},
	{x: 8, y: 4},
	{x: 1, y: 5},
	{x: 2, y: 5},
	{x: 3, y: 5},
	{x: 4, y: 5},
	{x: 5, y: 5},
	{x: 6, y: 5},
	{x: 7, y: 5},
	{x: 8, y: 5},
	{x: 1, y: 6},
	{x: 2, y: 6},
	{x: 3, y: 6},
	{x: 4, y: 6},
	{x: 5, y: 6},
	{x: 6, y: 6},
	{x: 7, y: 6},
	{x: 8, y: 6},
	{x: 1, y: 7},
	{x: 2, y: 7},
	{x: 3, y: 7},
	{x: 4, y: 7},
	{x: 5, y: 7},
	{x: 6, y: 7},
	{x: 7, y: 7},
	{x: 8, y: 7},
	{x: 1, y: 8},
	{x: 2, y: 8},
	{x: 3, y: 8},
	{x: 4, y: 8},
	{x: 5, y: 8},
	{x: 6, y: 8},
	{x: 7, y: 8},
	{x: 8, y: 8},
] as const;

export interface ColoredPiece {
	name: keyof typeof Pieces;
	side: keyof typeof Sides;
}

export interface CompletedPiece extends ColoredPiece {
	position: Coord;
}

export interface IncompletePiece extends ColoredPiece {
	weightedPosition: WeightedCoord;
}

export interface FinishedPiece extends IncompletePiece {
	entangledTo: Coord[];
	ofIndex: number;
}

export interface ObjectOrientedPosition {
	pieceSets: ColoredPiece[];
	partialPieces: FinishedPiece[];
}

export type anyPiece = ColoredPiece | CompletedPiece | IncompletePiece | FinishedPiece;

export interface Move {
	start: Coord;
	end: Coord;
}

export interface PieceMove {
	piece: anyPiece;
	move: Move;
}

export function isPartiallyLegal(move: PieceMove): boolean {
	switch (move.piece.name) {
	case
	}
}
