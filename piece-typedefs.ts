import Fraction from './arithmetic.ts';

enum Piece {
    pawn = "pawn",
    knight = "knight",
    bishop = "bishop",
    rook = "rook",
    queen = "queen",
    king = "king",
}

enum Side {
    white = "white",
    black = "black",
}

interface ColoredPiece {
    piece: Piece;
    side: Side;
}

interface IndexedPiece extends ColoredPiece {
    index: number;
}

export {
    Piece,
    Side,
    ColoredPiece,
    IndexedPiece,
};
