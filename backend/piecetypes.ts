import Fraction from './arithmetic.ts';

export type PartialCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Coord {
	x: PartialCoord;
	y: PartialCoord;
	promotion?: Piece;
}

export interface WeightedCoord extends Coord {
	probability: Fraction;
}

export enum Piece {
	pawn = "pawn",
	knight = "knight",
	bishop = "bishop",
	rook = "rook",
	queen = "queen",
	king = "king",
}

export enum Side {
	white = "white",
	black = "black",
}

export interface ColoredPiece {
	piece: Piece;
	side: Side;
}

export interface CompletedPiece extends ColoredPiece {
	position: Coord;
}

export interface IncompletePiece extends ColoredPiece {
	weightedPosition: WeightedCoord;
}

export interface EntangledPiece extends IncompletePiece {
	toArray: Coord[];
}

export interface FinishedPiece extends EntangledPiece {
	ofIndex: number;
}

export interface Move {
	start: Coord;
	end: Coord;
}
