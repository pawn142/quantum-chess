import { actualType, areCoordsEqual, getPiece, getTypeOfMove, isStandardMove, otherSide, CastleMove, CompletedPosition, CompletedSet, Coord, DeclaredMove, Enpassant, Move, MoveDeclarations, ObjectPosition, PartialCoord, PawnDoubleMove, Pieces, Play, Sides, SpecialMoves, StandardMove} from './piecetypes.ts';
import { GameData, Settings } from './metatypes.ts';

export function isInRange(move: StandardMove, piece: CompletedSet | keyof typeof Pieces, side: keyof typeof Sides = (piece as CompletedSet).pieceType.side ?? Sides.white): boolean {
	if (areCoordsEqual(move.start, move.end)) {
		return false;
	}
	const diff_x: number = move.end.x - move.start.x;
	const diff_y: number = move.end.y - move.start.y;
	const squaredDistance: number = diff_x ** 2 + diff_y ** 2;
	switch (typeof piece === "string" ? piece : actualType(piece)) {
		case Pieces.pawn:
			return squaredDistance <= 2 && (side === Sides.white ? move.end.y > move.start.y : move.end.y < move.start.y);
		case Pieces.knight:
			return squaredDistance === 5;
		case Pieces.bishop:
			return Math.abs(diff_x) === Math.abs(diff_y);
		case Pieces.rook:
			return !diff_x || !diff_y;
		case Pieces.queen:
			return Math.abs(diff_x) === Math.abs(diff_y) || !diff_x || !diff_y;
		case Pieces.king:
			return squaredDistance <= 2;
		default:
			throw new Error("Unidentified piece type in use of 'isInRange'");
	}
}

export function generateStartMiddleEnd(move: Move): [Coord, Coord[], Coord] {
	let current: Coord[] = [];
	if (isStandardMove(move)) {
		if (areCoordsEqual(move.start, move.end)) {
			throw new Error("Null move passed into 'generateMiddleSquares'");
		}
		const diff_x: number = move.end.x - move.start.x;
		const diff_y: number = move.end.y - move.start.y;
		if (!diff_x) {
			for (let i = Math.min(move.start.y, move.end.y) + 1, end = i + Math.abs(diff_y); i < end; ++i) {
				current.push({
					x: move.start.x,
					y: i as PartialCoord,
				});
			}
		} else if (!diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, end = i + Math.abs(diff_x); i < end; ++i) {
				current.push({
					x: i as PartialCoord,
					y: move.start.y,
				});
			}
		} else if (diff_x === diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, j = Math.min(move.start.y, move.end.y) + 1, end = i + Math.abs(diff_x); i < end; ++i, ++j) {
				current.push({
					x: i as PartialCoord,
					y: j as PartialCoord,
				});
			}
		} else if (diff_x === -diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, j = Math.max(move.start.y, move.end.y) - 1, end = i + Math.abs(diff_x); i < end; ++i, --j) {
				current.push({
					x: i as PartialCoord,
					y: j as PartialCoord,
				});
			}		
		} else if (Math.abs(diff_x) === 2 && Math.abs(diff_y) === 1) {
			current = [{
					       x: move.start.x + diff_x / 2 as PartialCoord,
					       y: move.start.y,
				       }, {
					       x: move.start.x + diff_x as PartialCoord,
					       y: move.start.y,
				          }];
		} else if (Math.abs(diff_x) === 1 && Math.abs(diff_y) === 2) {
			current = [{
					       x: move.start.x,
					       y: move.start.y + diff_y / 2 as PartialCoord,
				       }, {
					       x: move.start.x,
					       y: move.start.y + diff_y as PartialCoord,
				          }];
		} else {
			throw new Error("Invalid move passed into 'generateMiddleSquares'");
		}
		return [structuredClone(move.start), current, structuredClone(move.end)];
	} else {
		switch (getTypeOfMove(move)) {
			case SpecialMoves.castle:
				for (let i = 5; 1 < i && i < 8; i += (move as CastleMove).direction) {
					current.push({
						x: i as PartialCoord,
						y: (move as CastleMove).side === Sides.white ? 1 : 8,
					});
				}
				return [current[0]!, current.slice(1), current[2]!];
			case SpecialMoves.enpassant:
				return [structuredClone((move as Enpassant).attackingPawn), [], structuredClone((move as Enpassant).captureSquare)];
			case SpecialMoves.pawnDoubleMove:
				return [
					structuredClone((move as PawnDoubleMove).chosenPawn),
					[{
						x: (move as PawnDoubleMove).chosenPawn.x,
						y: (move as PawnDoubleMove).chosenPawn.y === 2 ? 3 : 6,
					}],
					{
						x: (move as PawnDoubleMove).chosenPawn.x,
						y: (move as PawnDoubleMove).chosenPawn.y === 2 ? 4 : 5,
					},
				];
			default:
				throw new Error("Unidentified move passed into 'generateMiddleSquares'");
		}
	}
}

export function isBlocked(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	const blockedSquares: Coord[] = completedPos.pieces.map(completedPiece => completedPiece.position);
	return significantSquares[1].some(square => blockedSquares.includes(square)) || getPiece(completedPos, significantSquares[0])!.pieceType.side === getPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function isCapture(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	return otherSide(getPiece(completedPos, significantSquares[0])!.pieceType.side) === getPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function isInCheck(whoseTurn: keyof typeof Sides, completedPos: CompletedPosition): boolean {
	const kingCoord: Coord = completedPos.pieces.find(completedPiece => completedPiece.pieceType.side === whoseTurn && completedPiece.pieceType.type_p === Pieces.king)!.position;
	return completedPos.pieces.filter(completedPiece => completedPiece.pieceType.side === otherSide(whoseTurn)).some(completedPiece => isInRange(
		{
			start: completedPiece.position,
			end: kingCoord,
		},
		completedPiece,
	) && !(actualType(completedPiece) === Pieces.pawn && completedPiece.position.y === kingCoord.y));
}

export function getResultOfMove(move: Move, completedPos: CompletedPosition): CompletedPosition {
	const copy: CompletedPosition = structuredClone(completedPos);
	if (isStandardMove(move)) {
		Object.assign(copy.pieces.find(completedPiece => areCoordsEqual(completedPiece.position, move.start))!.position, move.end);
	} else {
		switch (getTypeOfMove(move)) {
			case SpecialMoves.castle:
				getPiece(copy, {
					x: 5,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.position.x += 2 * (move as CastleMove).direction;
				getPiece(copy, {
					x: 4.5 + 3.5 * (move as CastleMove).direction as PartialCoord,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.position.x += 0.5 - 2.5 * (move as CastleMove).direction;
				break;
			case SpecialMoves.enpassant:
				Object.assign(getPiece(copy, (move as Enpassant).attackingPawn)!.position, (move as Enpassant).captureSquare);
				break;
			case SpecialMoves.pawnDoubleMove:
				(num => num = (num - 4.5) / 5 + 4.5)(getPiece(copy, (move as PawnDoubleMove).chosenPawn)!.position.y);
				break;
			default:
				throw new Error("Unidentified move passed into 'getMoveResult'");
		}
	}
	return copy;
}

export function isMoveLegal(declaredMove: DeclaredMove, completedPos: CompletedPosition, winByCheckmate: boolean, data: GameData): boolean {
	try {
		generateStartMiddleEnd(declaredMove.move);
	} catch {
		return false;
	}
	const movedPiece = getPiece(completedPos, generateStartMiddleEnd(declaredMove.move)[0]);
	if (!(movedPiece && (getTypeOfMove(declaredMove.move) || isStandardMove(declaredMove.move) && isInRange(declaredMove.move as StandardMove, movedPiece)))) {
		return false;
	}
	const result: CompletedPosition = getResultOfMove(declaredMove.move, completedPos);
	let current: boolean = movedPiece.pieceType.side === data.whoseTurn &&
	                       !(winByCheckmate && isInCheck(data.whoseTurn, result)) &&
	                       !(declaredMove.declarations.includes(MoveDeclarations.nonLeaping) && isBlocked(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.includes(MoveDeclarations.noCapture) && isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.includes(MoveDeclarations.captureOnly) && !isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.includes(MoveDeclarations.noCheck) && isInCheck(otherSide(data.whoseTurn), result)) &&
	                       !(declaredMove.declarations.includes(MoveDeclarations.checkOnly) && !isInCheck(otherSide(data.whoseTurn), result));
	switch (getTypeOfMove(declaredMove.move)) {
		case SpecialMoves.castle:
			current &&= data.whoseTurn === (declaredMove.move as CastleMove).side && Math.abs((declaredMove.move as CastleMove).direction) === 1 && ((declaredMove.move as CastleMove).direction === 1 ? data.whoseTurn === Sides.white ? data.castling.canWhiteCastleRight : data.castling.canBlackCastleRight : data.whoseTurn === Sides.white ? data.castling.canWhiteCastleLeft : data.castling.canBlackCastleLeft);
			break;
		case SpecialMoves.enpassant:
			current &&= data.enpassant && areCoordsEqual((declaredMove.move as Enpassant).captureSquare, {
				x: data.enpassant.x,
				y: data.enpassant.y + (data.whoseTurn === Sides.white ? 1 : -1) as PartialCoord,
			}) && Math.abs((declaredMove.move as Enpassant).captureSquare.x - movedPiece.position.x) === 1 && (declaredMove.move as Enpassant).captureSquare.y === movedPiece.position.y + (data.whoseTurn === Sides.white ? 1 : -1);
			break;
		case SpecialMoves.pawnDoubleMove:
			current &&= movedPiece.position.y === (data.whoseTurn === Sides.white ? 2 : 7);
	}
	return current;
}

/*export function generatePossibilities(quantumPos: ObjectPosition): CompletedPosition[] {

}

export function isMovePossible(move: declaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean): boolean {

}

export function isPlayLegal(play: Play, quantumPos: ObjectPosition, settings: Settings, data: GameData): boolean {

}*/
