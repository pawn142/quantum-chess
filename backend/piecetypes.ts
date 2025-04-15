import Fraction from './arithmetic.ts';
import { PartialCoord, Coord } from './metatypes.ts';

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

export interface EntangledPiece extends ColoredPiece {
	toArray: EntangledPiece[];
}

export interface Move {
	start: Coord;
	end: Coord;
	pieceBeingMoved: EntangledPiece;
}
