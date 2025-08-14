import Fraction from "./arithmetic.js";
import assert from "../assert.js";
export function isObject(candidate) {
    return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}
export const Pieces = {
    pawn: "pawn",
    knight: "knight",
    bishop: "bishop",
    rook: "rook",
    queen: "queen",
    king: "king",
};
export const PieceValues = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
};
export const PieceCosts = {
    pawn: 0,
    knight: 1,
    bishop: 1,
    rook: 2,
    queen: 3,
    king: 3,
};
export const validPromotions = new Set([
    Pieces.knight,
    Pieces.bishop,
    Pieces.rook,
    Pieces.queen,
    undefined
]);
export const Sides = {
    white: "white",
    black: "black",
};
export function otherSide(side) {
    return side === Sides.white ? Sides.black : Sides.white;
}
export function isPartialCoord(candidate) {
    return Number.isInteger(candidate) && 0 < candidate && candidate <= 8;
}
export function discardPromotion(coord) {
    return {
        x: coord.x,
        y: coord.y,
    };
}
export function isCoord(candidate) {
    return isObject(candidate) ? isPartialCoord(candidate.x) && isPartialCoord(candidate.y) && validPromotions.has(candidate.promotion) : false;
}
export function areCoordsEqual(coordOne, coordTwo) {
    return coordOne.x === coordTwo.x && coordOne.y === coordTwo.y;
}
export function translateCoord(coord, x_amount = 0, y_amount = 0, makeCopy = false) {
    const newCoord = makeCopy ? Fraction.fractionalClone(coord) : coord;
    newCoord.x += x_amount;
    newCoord.y += y_amount;
    assert(isCoord(newCoord), "Invalid translation passed into 'translateCoord'");
    return newCoord;
}
export function discardProbability(coord) {
    const copy = {
        x: coord.x,
        y: coord.y,
    };
    if ("promotion" in coord) {
        copy.promotion = coord.promotion;
    }
    return copy;
}
export function addProbability(coord) {
    const copy = structuredClone(coord);
    copy.probability = new Fraction;
    return copy;
}
export const chessboard = [
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
];
export function actualType(completedPiece) {
    return completedPiece.state.promotion ?? completedPiece.pieceType.type_p;
}
export const defaultData = {
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
export function getRespectiveQubitAmount(data) {
    return data.whoseTurn === Sides.white ? data.qubits.whiteBalance : data.qubits.blackBalance;
}
export function findUnit(objects, coord) {
    return objects.flatMap(objectSet => objectSet.units).find(unit => areCoordsEqual(unit.state, coord));
}
export function findObject(quantumPos, coord) {
    return quantumPos.objects.find(objectSet => objectSet.units.some(unit => areCoordsEqual(unit.state, coord)));
}
export function getCoordType(quantumPos, coord) {
    return findUnit(quantumPos.objects, coord)?.state.promotion ?? findObject(quantumPos, coord)?.pieceType.type_p;
}
export function getUnitType(quantumPos, unit) {
    return unit.state.promotion ?? quantumPos.objects.find(objectSet => objectSet.units.includes(unit)).pieceType.type_p;
}
export function getSide(quantumPos, side = quantumPos.otherData.whoseTurn) {
    return quantumPos.objects.filter(objectSet => objectSet.pieceType.side === side);
}
export function findObjectFromType(quantumPos, rawType, side) {
    return getSide(quantumPos, side).find(objectSet => objectSet.pieceType.type_p === rawType);
}
export function areOfDifferentObjects(quantumPos, coordOne, coordTwo) {
    return ((objectOne, objectTwo) => !!objectOne && !!objectTwo && objectOne !== objectTwo)(findObject(quantumPos, coordOne), findObject(quantumPos, coordTwo));
}
export function findPiece(completedPos, coord) {
    return completedPos.pieces.find(completedPiece => areCoordsEqual(completedPiece.state, coord));
}
export function findPieceFromType(completedPos, rawType, side) {
    return completedPos.pieces.find(completedPiece => completedPiece.pieceType.type_p === rawType && completedPiece.pieceType.side === side);
}
export const defaultPosition = {
    pieces: [
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 1, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 2, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 3, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 4, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 5, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 6, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 7, y: 2 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.white }, state: { x: 8, y: 2 } },
        { pieceType: { type_p: Pieces.rook, side: Sides.white }, state: { x: 1, y: 1 } },
        { pieceType: { type_p: Pieces.knight, side: Sides.white }, state: { x: 2, y: 1 } },
        { pieceType: { type_p: Pieces.bishop, side: Sides.white }, state: { x: 3, y: 1 } },
        { pieceType: { type_p: Pieces.queen, side: Sides.white }, state: { x: 4, y: 1 } },
        { pieceType: { type_p: Pieces.king, side: Sides.white }, state: { x: 5, y: 1 } },
        { pieceType: { type_p: Pieces.bishop, side: Sides.white }, state: { x: 6, y: 1 } },
        { pieceType: { type_p: Pieces.knight, side: Sides.white }, state: { x: 7, y: 1 } },
        { pieceType: { type_p: Pieces.rook, side: Sides.white }, state: { x: 8, y: 1 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 1, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 2, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 3, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 4, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 5, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 6, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 7, y: 7 } },
        { pieceType: { type_p: Pieces.pawn, side: Sides.black }, state: { x: 8, y: 7 } },
        { pieceType: { type_p: Pieces.rook, side: Sides.black }, state: { x: 1, y: 8 } },
        { pieceType: { type_p: Pieces.knight, side: Sides.black }, state: { x: 2, y: 8 } },
        { pieceType: { type_p: Pieces.bishop, side: Sides.black }, state: { x: 3, y: 8 } },
        { pieceType: { type_p: Pieces.queen, side: Sides.black }, state: { x: 4, y: 8 } },
        { pieceType: { type_p: Pieces.king, side: Sides.black }, state: { x: 5, y: 8 } },
        { pieceType: { type_p: Pieces.bishop, side: Sides.black }, state: { x: 6, y: 8 } },
        { pieceType: { type_p: Pieces.knight, side: Sides.black }, state: { x: 7, y: 8 } },
        { pieceType: { type_p: Pieces.rook, side: Sides.black }, state: { x: 8, y: 8 } },
    ],
    otherData: structuredClone(defaultData),
};
export function completedPositionToObjects(completedPos) {
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
export function objectsToFilledPosition(quantumPos) {
    return {
        pieces: quantumPos.objects.flatMap(objectSet => objectSet.units.map(unit => ({
            pieceType: structuredClone(objectSet.pieceType),
            state: discardProbability(unit.state),
        }))),
        otherData: structuredClone(quantumPos.otherData),
    };
}
export function objectsToSparsePosition(quantumPos) {
    return {
        pieces: quantumPos.objects.flatMap(objectSet => objectSet.units.filter(unit => unit.state.probability.equalTo(new Fraction)).map(unit => ({
            pieceType: structuredClone(objectSet.pieceType),
            state: discardProbability(unit.state),
        }))),
        otherData: structuredClone(quantumPos.otherData),
    };
}
export function coordToIndex(coord) {
    assert(isCoord(coord), "Invalid coordinate passed into 'coordToIndex'");
    return 63 + coord.x - 8 * coord.y;
}
export function indexToCoord(index) {
    assert(Number.isInteger(index) && 0 <= index && index < 64, "Invalid index passed into 'indexToCoord'");
    return {
        x: index % 8 + 1,
        y: 8 - Math.floor(index / 8),
    };
}
export class ChessboardPosition {
    fullPieces;
    squares;
    constructor(objects) {
        const currentPieces = [];
        const currentSquares = Array(64).fill(undefined);
        for (const objectSet of objects) {
            for (const unit of objectSet.units) {
                const squareIndex = coordToIndex(unit.state);
                const possibleEntanglements = new Set(objectSet.units.filter(otherPiece => otherPiece !== unit).map(otherPiece => JSON.stringify(discardPromotion(otherPiece.state))));
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
export function isStandardMove(candidate, permissive = false) {
    return isObject(candidate) ? isCoord(candidate.start) && isCoord(candidate.end) && (permissive || candidate.start.promotion === undefined) : false;
}
export function getCastleProperty(castleMove) {
    return castleMove.direction === 1 ? castleMove.side === Sides.white ? "canWhiteCastleRight" : "canBlackCastleRight" : castleMove.side ? "canWhiteCastleLeft" : "canBlackCastleLeft";
}
export function enpassantDisplacement(side) {
    return side === Sides.white ? 1 : -1;
}
export function pawnRank(side) {
    return side === Sides.white ? 2 : 7;
}
export function promotionRank(side) {
    return side === Sides.white ? 8 : 1;
}
export const SpecialMoves = {
    castle: "castle",
    enpassant: "enpassant",
    pawnDoubleMove: "pawnDoubleMove",
};
export function moveType(move) {
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
export const MoveDeclarations = {
    captureOnly: "captureOnly",
    noCapture: "noCapture",
    checkOnly: "checkOnly",
    noCheck: "noCheck",
    nonLeaping: "nonLeaping",
};
export const allDeclarations = new Set(Object.keys(MoveDeclarations));
