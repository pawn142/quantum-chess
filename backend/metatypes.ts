import Fraction from './arithmetic.ts';
import { Side } from './piecetypes.ts';

export const boardFiles: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

export type PartialCoord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Coord {
    x: PartialCoord;
    y: PartialCoord;
}

export interface WeightedCoord extends Coord {
    probability: Fraction;
}

export function coordserialize(coordinate: Coord): string {
    return boardFiles[coordinate.x - 1] + coordinate.y.toString();
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
];

export class PieceEntanglement {
    from: number;
    to: number;
    constructor(fromCandidate: number, toCandidate: number, positionList: Coord[] | WeightedCoord[] = chessboard) {
        if (!Number.isInteger(fromCandidate) || !Number.isInteger(toCandidate)) {
            throw new Error("Tried to initialize PieceEntanglement with a non-integer from index or to index");
        }
        if (!(0 <= fromCandidate && fromCandidate < positionList.length && 0 <= toCandidate && toCandidate < positionList.length)) {
            throw new Error("Tried to initialize PieceEntanglement with a from index or to index that is out of bounds");
        }
        this.from = fromCandidate;
        this.to = toCandidate;
    }
}

export interface PieceSet {
    positions: WeightedCoord[];
    pieceEntanglements: PieceEntanglement[];
};

export interface HalfPosition {
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

export interface CompletedHalfPosition {
    p1?: Coord;
    p2?: Coord;
    p3?: Coord;
    p4?: Coord;
    p5?: Coord;
    p6?: Coord;
    p7?: Coord;
    p8?: Coord;
    r1?: Coord;
    n1?: Coord;
    b1?: Coord;
    q?:  Coord;
    k?:  Coord;
    b2?: Coord;
    n2?: Coord;
    r2?: Coord;
}

export interface GamePosition {
    whitePosition: HalfPosition;
    blackPosition: HalfPosition;
    whoseTurn: Side;
    castling: {
        canWhiteCastle: boolean;
        canBlackCastle: boolean;
    };
    enpassant: Coord | false;
}

export interface CompletedPosition {
    whitePosition: CompletedHalfPosition;
    blackPosition: CompletedHalfPosition;
    whoseTurn?: Side;
    castling?: {
        canWhiteCastle: boolean;
        canBlackCastle: boolean;
    };
    enpassant?: Coord | false;
}

export const defaultPosition: CompletedPosition = {
    whitePosition: {
        p1: {x: 1, y: 2},
        p2: {x: 2, y: 2},
        p3: {x: 3, y: 2},
        p4: {x: 4, y: 2},
        p5: {x: 5, y: 2},
        p6: {x: 6, y: 2},
        p7: {x: 7, y: 2},
        p8: {x: 8, y: 2},
        r1: {x: 1, y: 1},
        n1: {x: 2, y: 1},
        b1: {x: 3, y: 1},
        q:  {x: 4, y: 1},
        k:  {x: 5, y: 1},
        b2: {x: 6, y: 1},
        n2: {x: 7, y: 1},
        r2: {x: 8, y: 1},
    },
    blackPosition: {
        p1: {x: 1, y: 7},
        p2: {x: 2, y: 7},
        p3: {x: 3, y: 7},
        p4: {x: 4, y: 7},
        p5: {x: 5, y: 7},
        p6: {x: 6, y: 7},
        p7: {x: 7, y: 7},
        p8: {x: 8, y: 7},
        r1: {x: 1, y: 8},
        n1: {x: 2, y: 8},
        b1: {x: 3, y: 8},
        q:  {x: 4, y: 8},
        k:  {x: 5, y: 8},
        b2: {x: 6, y: 8},
        n2: {x: 7, y: 8},
        r2: {x: 8, y: 8},
    },
    whoseTurn: Side.white,
    castling: {
        canWhiteCastle: true,
        canBlackCastle: true,
    },
    enpassant: false,
};

export function completedPositionToPosition(completedPosition: CompletedPosition): GamePosition {
    return {
        whitePosition: Object.fromEntries(Object.entries(completedPosition.whitePosition).map(([whitePieceCoordKey, whitePieceCoord]: [string, Coord]) => ([
            whitePieceCoordKey,
            {
                positions: [Object.fromEntries([...Object.entries(whitePieceCoord), ["probability", new Fraction(1, 1)]])],
                pieceEntanglements: [],
            },
        ]))),
        blackPosition: Object.fromEntries(Object.entries(completedPosition.blackPosition).map(([blackPieceCoordKey, blackPieceCoord]: [string, Coord]) => ([
            blackPieceCoordKey,
            {
                positions: [Object.fromEntries([...Object.entries(blackPieceCoord), ["probability", new Fraction(1, 1)]])],
                pieceEntanglements: [],
            },
        ]))),
        whoseTurn: (completedPosition.whoseTurn ?? defaultPosition.whoseTurn)!,
        castling: (completedPosition.castling ?? defaultPosition.castling)!,
        enpassant: (completedPosition.enpassant ?? defaultPosition.enpassant)!,
    };
}

export function getPositionString(gamePosition: GamePosition): string {
    let positionString: string = `turn: ${gamePosition.whoseTurn}, castling: white ${gamePosition.castling.canWhiteCastle.toString()} black ${gamePosition.castling.canBlackCastle.toString()}, enpassant: ${gamePosition.enpassant ? coordserialize(gamePosition.enpassant) : "false"}`;
    Object.entries(gamePosition.whitePosition).forEach(([whiteKey, whitePiece]: [string, PieceSet]) => {
        let whitePieceString: string = "";
        for (let whiteCoordinate of whitePiece.positions) {
            whitePieceString += ` (${coordserialize(whiteCoordinate)},${whiteCoordinate.probability.serialize()}),`;
        }
        for (let whiteEntanglement of whitePiece.pieceEntanglements) {
            whitePieceString += ` <${whiteEntanglement.from}-${whiteEntanglement.to}>,`;
        }
        positionString += `|${whiteKey[0]!.toUpperCase() + whiteKey.slice(1)}:${whitePieceString.slice(0, -1)}`;
    });
    Object.entries(gamePosition.blackPosition).forEach(([blackKey, blackPiece]: [string, PieceSet]) => {
        let blackPieceString: string = "";
        for (let blackCoordinate of blackPiece.positions) {
            blackPieceString += ` (${coordserialize(blackCoordinate)},${blackCoordinate.probability.serialize()}),`;
        }
        for (let blackEntanglement of blackPiece.pieceEntanglements) {
            blackPieceString += ` <${blackEntanglement.from}-${blackEntanglement.to}>,`;
        }
        positionString += `|${blackKey}:${blackPieceString.slice(0, -1)}`;
    });
    return positionString;
}

export function getPositionFromString(positionString: string): GamePosition {
    const components: string[] = positionString.split("|");
    const metadata: string[] = components[0]!.split(" ");
    let whitePositionArray: [string, PieceSet][] = [];
    let blackPositionArray: [string, PieceSet][] = [];
    for (const pieceString of components.slice(1)) {
        let positionArray: WeightedCoord[] = [];
        let entanglementArray: PieceEntanglement[] = [];
        for (const segment of pieceString.split(" ").slice(1)) {
            if (segment[0] === "(") {
                positionArray.push({
                    x: boardFiles.indexOf(segment[1]!) + 1 as PartialCoord,
                    y: parseInt(segment[2]!) as PartialCoord,
                    probability: new Fraction(parseInt(segment.split(",")[1]!.split("/")[0]!), parseInt(segment.split("/")[1]!.slice(0, -1))),
                });
            } else {
                entanglementArray.push(new PieceEntanglement(parseInt(segment[1]!), parseInt(segment[3]!)));
            }
        }
        (pieceString[0] === pieceString[0]!.toLowerCase() ? blackPositionArray : whitePositionArray).push([pieceString.slice(0, 2).toLowerCase(), {
            positions: positionArray,
            pieceEntanglements: entanglementArray,
        }]);
    }
    return {
        whitePosition: Object.fromEntries(whitePositionArray),
        blackPosition: Object.fromEntries(blackPositionArray),
        whoseTurn: Side[metadata[1]!.slice(0, -1) as keyof typeof Side],
        castling: {
            canWhiteCastle: JSON.parse(metadata[4]!),
            canBlackCastle: JSON.parse(metadata[6]!.slice(0, -1)),
        },
        enpassant: metadata[8] === "false" ? false : {
            x: boardFiles.indexOf(metadata[8]![0]!) + 1 as PartialCoord,
            y: parseInt(metadata[8]![1]!) as PartialCoord,
        },
    };
}
