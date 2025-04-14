import Fraction from './arithmetic.ts';

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

export interface IndexedPiece extends ColoredPiece {
    index: number;
}
