import Fraction from './arithmetic.ts';

enum Piece {
    pawn,
    knight,
    bishop,
    rook,
    queen,
    king,
}

enum Side {
    white,
    black,
}

interface ColoredPiece {
    piece: Piece;
    side: Side;
}

interface IndexedPiece extends ColoredPiece {
    index: number;
}

type PartialCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface Coord {
    x: partialCoord;
    y: partialCoord;
}

interface WeightedCoord extends Coord {
    probability: Fraction;
}

class PieceEntanglement {
    from: number;
    to: number;
    constructor(fromCandidate: number, toCandidate: number, positionList: WeightedCoord[]) {
        if (!Number.isInteger(fromCandidate) || !Number.isInteger(toCandidate))
            throw new Error("Tried to initialize PieceEntanglement with a non-integer from index or to index");
        if (!(0 <= fromCandidate && fromCandidate < positionList.length && 0 <= toCandidate && toCandidate < positionList.length)) {
            throw new Error("Tried to initialize PieceEntanglement with a from index or to index that is out of bounds");
        this.from = fromCandidate;
        this.to = toCandidate;
    }
}

type PieceSet = {
    positions: WeightedCoord[];
    pieceEntanglements: PieceEntanglement[];
};

interface HalfPosition = {
    p1?: PieceSet;
    p2?: PieceSet;
    p3?: PieceSet;
    p4?: PieceSet;
    p5?: PieceSet;
    p6?: PieceSet;
    p7?: PieceSet;
    p8?: PieceSet;
    r1?: PieceSet;
    k1?: PieceSet;
    b1?: PieceSet;
    q?:  PieceSet;
    k?:  PieceSet;
    b2?: PieceSet;
    k2?: PieceSet;
    r2?: PieceSet;
}

interface GamePosition = {
    whitePosition: HalfPosition;
    blackPosition: HalfPosition;
    whoseTurn: Side;
    castling: {
        canWhiteCastle: boolean;
        canBlackCastle: boolean;
    };
    enPassant: Coord | false;
}

function getPositionString(data: GamePosition): string {
    let positionString: string = "";
    Object.entries(data.whitePosition).forEach(([whitePieceKey, whitePiece]) => {
        if (whitePiece) {
            let piecesString: string = "";
            positionString += `${whitePieceKey[0].toUpperCase() + whitePieceKey.slice(1)}(${whitePiece}`
        }
    });
    Object.entries(data.blackPosition).forEach(([blackPieceKey, blackPiece]) => {
        if (blackPiece) {
            positionString += `${blackPieceKey}(${blackPiece}`
        }
    });
}

function getDataFromString(positionString: string): GamePosition {
    
}
