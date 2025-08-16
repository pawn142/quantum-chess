import Fraction from "./arithmetic.js";
import assert from "../assert.js";
import { Sounds } from "../scripts/toolbox.js";

import { actualType, allDeclarations, areCoordsEqual, areOfDifferentObjects, chessboard, completedPositionToObjects, coordToIndex, defaultData, defaultPosition, discardPromotion, discardProbability, enpassantDisplacement, findObject, findObjectFromType, findPiece, findPieceFromType, findUnit, getCastleProperty, getCoordType, getRespectiveQubitAmount, getSide, getUnitType, isCoord, isStandardMove, moveType, objectsToFilledPosition, otherSide, pawnRank, promotionRank, translateCoord, validPromotions, CastleMove, ChessboardPosition, CompletedPosition, CompletedSet, Coord, DeclaredMove, Enpassant, GameData, Move, MoveDeclarations, ObjectPosition, ObjectSet, PartialCoord, PawnDoubleMove, Pieces, PieceCosts, PieceValues, Play, PositionedPiece, Sides, SpecialMoves, StandardMove } from "./piecetypes.js";
import { allowedDeclarations, coordserialize, decodeSegment, defaultSettings, getCastleValues, getDataFromString, getDataString, measurePartiallyCaptured, objectsToGamePosition, GameSettings } from "./metatypes.js";
import { chooseElement, chooseWeightedElement, random } from "./random.js";

export const epsilon: 1e-10 = 1e-10 as const;

export function getPairsOfElements<T>(array: T[]): [T, T][] {
	const currentPairs: [T, T][] = [];
	for (let i = 0; i < array.length; ++i) {
		for (let j = i + 1; j < array.length; ++j) {
			currentPairs.push([array[i]!, array[j]!]);
		}
	}
	return currentPairs;
}

export function isInRange(move: StandardMove, piece: CompletedSet | keyof typeof Pieces, side: keyof typeof Sides = typeof piece === "string" ? Sides.white : piece.pieceType.side): boolean {
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
			throw new Error("Unidentified piece type passed into 'isInRange'");
	}
}

export function generateStartMiddleEnd(move: Move): [Coord, Coord[], Coord] {
	let coords: Coord[] = [];
	if (isStandardMove(move, true)) {
		assert(!areCoordsEqual(move.start, move.end), "Null move passed into 'generateStartMiddleEnd'");
		const diff_x: number = move.end.x - move.start.x;
		const diff_y: number = move.end.y - move.start.y;
		if (!diff_x) {
			for (let i = Math.min(move.start.y, move.end.y) + 1, end = i + Math.abs(diff_y) - 1; i < end; ++i) {
				coords.push({
					x: move.start.x,
					y: i as PartialCoord,
				});
			}
		} else if (!diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, end = i + Math.abs(diff_x) - 1; i < end; ++i) {
				coords.push({
					x: i as PartialCoord,
					y: move.start.y,
				});
			}
		} else if (diff_x === diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, j = Math.min(move.start.y, move.end.y) + 1, end = i + Math.abs(diff_x) - 1; i < end; ++i, ++j) {
				coords.push({
					x: i as PartialCoord,
					y: j as PartialCoord,
				});
			}
		} else if (diff_x === -diff_y) {
			for (let i = Math.min(move.start.x, move.end.x) + 1, j = Math.max(move.start.y, move.end.y) - 1, end = i + Math.abs(diff_x) - 1; i < end; ++i, --j) {
				coords.push({
					x: i as PartialCoord,
					y: j as PartialCoord,
				});
			}		
		} else if (Math.abs(diff_x) === 2 && Math.abs(diff_y) === 1) {
			coords = [{
				x: move.start.x + diff_x / 2 as PartialCoord,
				y: move.start.y,
			}, {
				x: move.start.x + diff_x as PartialCoord,
				y: move.start.y,
			}];
		} else if (Math.abs(diff_x) === 1 && Math.abs(diff_y) === 2) {
			coords = [{
				x: move.start.x,
				y: move.start.y + diff_y / 2 as PartialCoord,
			}, {
				x: move.start.x,
				y: move.start.y + diff_y as PartialCoord,
			}];
		} else {
			throw new Error("Invalid move passed into 'generateStartMiddleEnd'");
		}
		return [discardPromotion(move.start), coords, discardPromotion(move.end)];
	} else {
		switch (moveType(move)) {
			case SpecialMoves.castle:
				for (let i = 5; 1 < i && i < 8; i += (move as CastleMove).direction) {
					coords.push({
						x: i as PartialCoord,
						y: (move as CastleMove).side === Sides.white ? 1 : 8,
					});
				}
				return [coords[0]!, coords.slice(1), structuredClone(coords[2]!)];
			case SpecialMoves.enpassant:
				return [discardPromotion((move as Enpassant).attackingPawn), [], discardPromotion((move as Enpassant).captureSquare)];
			case SpecialMoves.pawnDoubleMove:
				return [
					discardPromotion((move as PawnDoubleMove).pushedPawn),
					[{
						x: (move as PawnDoubleMove).pushedPawn.x,
						y: (move as PawnDoubleMove).pushedPawn.y === 2 ? 3 : 6,
					}],
					{
						x: (move as PawnDoubleMove).pushedPawn.x,
						y: (move as PawnDoubleMove).pushedPawn.y === 2 ? 4 : 5,
					},
				];
			default:
				throw new Error("Unidentified move passed into 'generateStartMiddleEnd'");
		}
	}
}

export function isBlocked(move: Move, completedPos: CompletedPosition): boolean {
	const occupiedSquares: Set<string> = new Set(completedPos.pieces.map(completedPiece => JSON.stringify(discardPromotion(completedPiece.state))));
	return generateStartMiddleEnd(move)[1].some(square => occupiedSquares.has(JSON.stringify(square)));
}

export function getBlockingPieces(move: Move, completedPos: CompletedPosition): CompletedSet[] {
	const middleSquares: Set<string> = new Set(generateStartMiddleEnd(move)[1].map(coord => JSON.stringify(coord)));
	return completedPos.pieces.filter(completedPiece => middleSquares.has(JSON.stringify(discardPromotion(completedPiece.state))));
}

export function isEndpointBlocked(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	return findPiece(completedPos, significantSquares[0])!.pieceType.side === findPiece(completedPos, significantSquares[2])?.pieceType.side;
}

export function getCapturedSquare(move: Move): Coord {
	return moveType(move) === SpecialMoves.enpassant ? translateCoord((move as Enpassant).captureSquare, 0, (move as Enpassant).captureSquare.y === 3 ? 1 : -1, true) : generateStartMiddleEnd(move)[2];
}

export function isCapture(move: Move, completedPos: CompletedPosition): boolean {
	return otherSide(findPiece(completedPos, generateStartMiddleEnd(move)[0])!.pieceType.side) === findPiece(completedPos, getCapturedSquare(move))?.pieceType.side;
}

export function getLeapCheckingPieces(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord: Coord | undefined = findPieceFromType(completedPos, Pieces.king, whoseTurn)?.state): CompletedSet[] {
	return kingCoord ? completedPos.pieces.filter(completedPiece => completedPiece.pieceType.side === otherSide(whoseTurn) && isInRange({
		start: completedPiece.state,
		end: kingCoord,
	}, completedPiece) && !(actualType(completedPiece) === Pieces.pawn && completedPiece.state.x === kingCoord.x)) : [];
}

export function getCheckingPieces(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord: Coord | undefined = findPieceFromType(completedPos, Pieces.king, whoseTurn)?.state): CompletedSet[] {
	return kingCoord ? getLeapCheckingPieces(completedPos, whoseTurn, kingCoord).filter(completedPiece => actualType(completedPiece) === Pieces.knight || !isBlocked({
		start: completedPiece.state,
		end: kingCoord,
	}, completedPos)) : [];
}

export function isInCheck(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord?: Coord): boolean {
	return !!getCheckingPieces(completedPos, whoseTurn, kingCoord).length;
}

export function makeMove(move: Move, position: CompletedPosition | ObjectPosition): void {
	const findFunction: any = "pieces" in position ? findPiece : (quantumPos: ObjectPosition, coord: Coord) => {
		return findUnit(quantumPos.objects, coord);
	};
	if (isStandardMove(move)) {
		Object.assign(findFunction(position, move.start).state, move.end);
	} else {
		switch (moveType(move)) {
			case SpecialMoves.castle:
				findFunction(position, {
					x: 5,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				}).state.x += 2 * (move as CastleMove).direction;
				findFunction(position, {
					x: 4.5 + 3.5 * (move as CastleMove).direction as PartialCoord,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				}).state.x += 0.5 - 2.5 * (move as CastleMove).direction;
				break;
			case SpecialMoves.enpassant:
				Object.assign(findFunction(position, (move as Enpassant).attackingPawn).state, (move as Enpassant).captureSquare);
				break;
			case SpecialMoves.pawnDoubleMove:
				(pawnCoord => {
					if (position.otherData) {
						position.otherData.enpassant = translateCoord(discardPromotion(pawnCoord), 0, enpassantDisplacement(position.otherData.whoseTurn));
					}
					pawnCoord.y = (pawnCoord.y - 4.5) / 5 + 4.5 as PartialCoord;
				})(findFunction(position, (move as PawnDoubleMove).pushedPawn).state);
				break;
			default:
				throw new Error("Unidentified move passed into 'getResultOfMove'");
		}
	}
}

export function getResultOfMove(move: Move, completedPos: CompletedPosition, makeCopy: boolean = false): CompletedPosition {
	const newCompletedPos: CompletedPosition = makeCopy ? structuredClone(completedPos) : completedPos;
	const capturedSquare: Coord = getCapturedSquare(move);
	const capturedIndex: number = newCompletedPos.pieces.findIndex(completedPiece => areCoordsEqual(completedPiece.state, capturedSquare));
	if (capturedIndex !== -1) {
		newCompletedPos.pieces.splice(capturedIndex, 1);
	}
	if (newCompletedPos.otherData) {
		newCompletedPos.otherData.enpassant = false;
	}
	makeMove(move, newCompletedPos);
	if (newCompletedPos.otherData) {
		newCompletedPos.otherData.whoseTurn = otherSide(newCompletedPos.otherData.whoseTurn);
		const castleValues: [boolean, boolean, boolean, boolean] = getCastleValues(objectsToGamePosition(completedPositionToObjects(newCompletedPos)));
		newCompletedPos.otherData.castling.canWhiteCastleLeft  &&= castleValues[0];
		newCompletedPos.otherData.castling.canWhiteCastleRight &&= castleValues[1];
		newCompletedPos.otherData.castling.canBlackCastleLeft  &&= castleValues[2];
		newCompletedPos.otherData.castling.canBlackCastleRight &&= castleValues[3];
	}
	return newCompletedPos;
}

export function getRequiredDeclarations(move: Move, rawType: keyof typeof Pieces): Set<keyof typeof MoveDeclarations> {
	const currentDeclarations: Set<keyof typeof MoveDeclarations> = new Set;
	if (rawType === Pieces.pawn) {
		const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
		currentDeclarations.add(significantSquares[0].x === significantSquares[2].x ? MoveDeclarations.noCapture : MoveDeclarations.captureOnly);
	}
	if (rawType !== Pieces.knight) {
		currentDeclarations.add(MoveDeclarations.nonLeaping);
	}
	return currentDeclarations;
}

export function isMoveLegal(declaredMove: DeclaredMove, completedPos: CompletedPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate, data: GameData = completedPos.otherData ?? defaultData): boolean {
	let significantSquares: [Coord, Coord[], Coord];
	try {
		significantSquares = generateStartMiddleEnd(declaredMove.move);
	} catch {
		return false;
	}
	const movedPiece: CompletedSet | undefined = findPiece(completedPos, significantSquares[0]);
	if (!(movedPiece && (moveType(declaredMove.move) || isStandardMove(declaredMove.move) && isInRange(declaredMove.move, movedPiece) && (!declaredMove.move.end.promotion || declaredMove.move.end.y === promotionRank(data.whoseTurn) && actualType(movedPiece) === Pieces.pawn)))) {
		return false;
	}
	const moveResult: CompletedPosition = getResultOfMove(declaredMove.move, completedPos, true);
	let current: boolean = movedPiece.pieceType.side === data.whoseTurn &&
	                       !isEndpointBlocked(declaredMove.move, completedPos) &&
	                       !(winByCheckmate && isInCheck(moveResult, data.whoseTurn)) &&
	                       declaredMove.declarations.isSubsetOf(allDeclarations) &&
	                       declaredMove.declarations.isSupersetOf(getRequiredDeclarations(declaredMove.move, actualType(movedPiece))) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.nonLeaping) && isBlocked(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCapture) && isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.captureOnly) && !isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCheck) && isInCheck(moveResult, otherSide(data.whoseTurn))) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.checkOnly) && !isInCheck(moveResult, otherSide(data.whoseTurn)));
	switch (moveType(declaredMove.move)) {
		case SpecialMoves.castle:
			current &&= data.whoseTurn === (declaredMove.move as CastleMove).side && Math.abs((declaredMove.move as CastleMove).direction) === 1 && data.castling[getCastleProperty(declaredMove.move as CastleMove)] && !(winByCheckmate && isInCheck(completedPos, data.whoseTurn));
			translateCoord(movedPiece.state, (declaredMove.move as CastleMove).direction);
			current &&= !(winByCheckmate && isInCheck(completedPos, data.whoseTurn));
			translateCoord(movedPiece.state, -(declaredMove.move as CastleMove).direction);
			break;
		case SpecialMoves.enpassant:
			current &&= data.enpassant && areCoordsEqual((declaredMove.move as Enpassant).captureSquare, data.enpassant) && Math.abs((declaredMove.move as Enpassant).captureSquare.x - movedPiece.state.x) === 1 && (declaredMove.move as Enpassant).captureSquare.y === movedPiece.state.y + enpassantDisplacement(data.whoseTurn);
			break;
		case SpecialMoves.pawnDoubleMove:
			current &&= actualType(movedPiece) === Pieces.pawn && movedPiece.state.y === pawnRank(data.whoseTurn);
	}
	return current;
}

export function generatePossiblePositions(quantumPos: ObjectPosition, fixedObjectIndex?: number, fixedUnitIndex?: number): CompletedPosition[] {
	const completedPositions: CompletedPosition[] = [];
	const currentIndexes: number[] = Array(quantumPos.objects.length).fill(0);
	const limitIndexes: number[] = quantumPos.objects.map(objectSet => objectSet.units.length + (Fraction.sum(...objectSet.units.map(unit => unit.state.probability)).lessThan(new Fraction) ? 1 : 0));
	if (fixedObjectIndex !== undefined && fixedUnitIndex !== undefined) {
		currentIndexes[fixedObjectIndex] = fixedUnitIndex;
	}
	let pointer: number = 0;
	while (pointer >= 0) {
		completedPositions.push({
			pieces: quantumPos.objects.flatMap((objectSet, objectIndex) => objectSet.units[currentIndexes[objectIndex]!] ? [({
				pieceType: structuredClone(objectSet.pieceType),
				state: discardProbability(objectSet.units[currentIndexes[objectIndex]!]!.state),
			})] : []),
			otherData: structuredClone(quantumPos.otherData),
		});
		pointer = currentIndexes.length - 1;
		while (pointer >= 0 && (pointer === fixedObjectIndex || ++currentIndexes[pointer]! === limitIndexes[pointer])) {
			if (pointer !== fixedObjectIndex) {
				currentIndexes[pointer] = 0;
			}
			--pointer;
		}
	}
	return completedPositions;
}

export function isMovePossible(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate): boolean {
	return generatePossiblePositions(quantumPos).some(completedPos => isMoveLegal(declaredMove, completedPos, winByCheckmate));
}

export function isMoveAlwaysLegal(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate): boolean {
	return generatePossiblePositions(quantumPos).every(completedPos => isMoveLegal(declaredMove, completedPos, winByCheckmate));
}

export function getLocalMoves(declaredMoves: DeclaredMove[], unitCoord: Coord): DeclaredMove[] {
	return declaredMoves.filter(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], unitCoord));
}

export function calculateQubitCost(play: Play, objectSet: ObjectSet, advancedQubitMode: boolean = defaultSettings.advancedQubitMode): number {
	let currentCost: number = 0;
	for (const unit of objectSet.units) {
		const moveTotal = getLocalMoves([...play.primaryMoves, ...play.defaultMoves], unit.state).length;
		if (moveTotal > 1) {
			if (advancedQubitMode) {
				currentCost += Math.sqrt(unit.state.probability.value()) * (Math.sqrt(moveTotal) - 1);
			} else {
				currentCost += moveTotal - 1;
			}
		}
	}
	return currentCost * PieceCosts[objectSet.pieceType.type_p];
}

export function calculateBoardValue(quantumPos: ObjectPosition, partialQubitRewards: boolean = defaultSettings.partialQubitRewards, side: keyof typeof Sides = otherSide(quantumPos.otherData.whoseTurn)): number {
	return quantumPos.objects.map(objectSet => objectSet.pieceType.side === side ? PieceValues[objectSet.pieceType.type_p] * (num => partialQubitRewards ? num : Math.ceil(num))(Fraction.sum(...objectSet.units.map(unit => unit.state.probability)).value()) : 0).reduce((accumulator, current) => accumulator + current, 0);
}

export function checkPlayValidity(play: Play, quantumPos: ObjectPosition, settings: GameSettings = defaultSettings): Set<string> {
	const playedObject: ObjectSet | undefined = quantumPos.objects[play.objectIndex];
	const problems: Set<string> = new Set;
	if (!play.primaryMoves.length) {
		return play.defaultMoves.length ? new Set(["Cannot have only default moves"]) : settings.nullPlays ? new Set() : new Set(["Null plays are not allowed in settings"]);
	}
	assert(!!playedObject && playedObject.pieceType.side === quantumPos.otherData.whoseTurn, "Invalid object index passed into 'isPlayLegal'");
	if ([...play.primaryMoves, ...play.defaultMoves].some(declaredMove => !declaredMove.declarations.difference(getRequiredDeclarations(declaredMove.move, getCoordType(quantumPos, generateStartMiddleEnd(declaredMove.move)[0])!)).isSubsetOf(allowedDeclarations(settings)))) {
		problems.add("One or more external declarations are not allowed in settings");
	}
	if (play.defaultMoves.some(defaultMove => play.primaryMoves.some(primaryMove => areCoordsEqual(generateStartMiddleEnd(primaryMove.move)[0], generateStartMiddleEnd(defaultMove.move)[0]) && areCoordsEqual(generateStartMiddleEnd(primaryMove.move)[2], generateStartMiddleEnd(defaultMove.move)[2])))) {
		problems.add("A default move cannot be equal to a primary move");
	}
	if (play.primaryMoves.filter(declaredMove => moveType(declaredMove.move) === SpecialMoves.pawnDoubleMove).length > 1) {
		problems.add("Only one pawn double move per play");
	}
	if (getPairsOfElements([...play.primaryMoves, ...play.defaultMoves]).some(movePair => areCoordsEqual(generateStartMiddleEnd(movePair[0].move)[2], generateStartMiddleEnd(movePair[1].move)[2]) && getCoordType(quantumPos, generateStartMiddleEnd(movePair[0].move)[0]) !== getCoordType(quantumPos, generateStartMiddleEnd(movePair[1].move)[0]))) {
		problems.add("Units with different promotion values are not mergeable");
	}
	const unitPositions: Set<string> = new Set(playedObject!.units.map(unit => JSON.stringify(discardPromotion(unit.state))));
	if (play.primaryMoves.some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add("One or more primary moves are impossible");
	}
	if (play.defaultMoves.some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add("One or more default moves are impossible");
	}
	if (getRespectiveQubitAmount(quantumPos.otherData) - calculateQubitCost(play, playedObject!, settings.advancedQubitMode) < -epsilon) {
		problems.add("Not enough qubits for play");
	}
	playedObject!.units.forEach((unit, unitIndex) => {
		const localPrimaries: DeclaredMove[] = getLocalMoves(play.primaryMoves, unit.state);
		const localDefaults: DeclaredMove[] = getLocalMoves(play.defaultMoves, unit.state);
		if (localDefaults.length > 1) {
			problems.add("Only one default move per unit");
		}
		if (localDefaults.length && !localPrimaries.length) {
			problems.add("Cannot have a default move without a corresponding primary move");
		}
		if (!settings.allowCastling && [...localPrimaries, ...localDefaults].some(declaredMove => moveType(declaredMove.move) === SpecialMoves.castle)) {
			problems.add("Castling is not allowed in settings");
		}
		if (!settings.castleSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => moveType(declaredMove.move) === SpecialMoves.castle)) {
			problems.add("Making a split move while castling is not allowed in settings");
		}
		if (!settings.pawnDoubleMoveSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => moveType(declaredMove.move) === SpecialMoves.pawnDoubleMove)) {
			problems.add("Making a split move while making a pawn double move is not allowed in settings");
		}
		if (settings.winByCheckmate && generatePossiblePositions(quantumPos, play.objectIndex, unitIndex).some(completedPos => isInCheck(completedPos) && !(localDefaults[0] && isMoveLegal(localDefaults[0], completedPos, true)) && (!localPrimaries.length || localPrimaries.some(declaredMove => !isMoveLegal(declaredMove, completedPos, true))))) {
			problems.add("Not all possible outcomes resolve check");
		}
	});
	return problems;
}

export function isPlayLegal(play: Play, quantumPos: ObjectPosition, settings: GameSettings = defaultSettings) {
	return !checkPlayValidity(play, quantumPos, settings).size;
}

export function getCheckingDependencies(checkedCoords: Coord[], quantumPos: ObjectPosition, side: keyof typeof Sides, firstMove?: Move, playedObject?: ObjectSet): Coord[] {
	const filledPos: CompletedPosition = objectsToFilledPosition(quantumPos);
	if (firstMove) {
		getResultOfMove(firstMove, filledPos);
	}
	return checkedCoords.flatMap(checkedCoord => getLeapCheckingPieces(filledPos, side, checkedCoord).flatMap(checkingPiece => ((possiblePositions, predicate) => {
		if (firstMove) {
			possiblePositions.forEach(completedPos => getResultOfMove(firstMove, completedPos));
		}
		return possiblePositions.some(completedPos => predicate(completedPos)) && possiblePositions.some(completedPos => !predicate(completedPos));
	})(generatePossiblePositions(quantumPos, playedObject ? quantumPos.objects.indexOf(playedObject) : undefined, firstMove ? playedObject?.units.findIndex(unit => areCoordsEqual(unit.state, generateStartMiddleEnd(firstMove)[0])) : undefined), ((completedPos: CompletedPosition) => !!findPiece(completedPos, checkedCoord) && !!findPiece(completedPos, checkingPiece.state) && (actualType(checkingPiece) === Pieces.knight || !isBlocked({
		start: checkingPiece.state,
		end: checkedCoord,
	}, completedPos)))) ? (actualType(checkingPiece) === Pieces.knight ? [] : getBlockingPieces({
		start: checkingPiece.state,
		end: checkedCoord,
	}, filledPos).map(blockingPiece => discardPromotion(blockingPiece.state))).filter(coord => areOfDifferentObjects(quantumPos, coord, checkedCoords[0]!) && (firstMove ? !areCoordsEqual(coord, generateStartMiddleEnd(firstMove)[2]) : true)).concat(checkedCoord, discardPromotion(checkingPiece.state)) : []));
}

export function generateDependencies(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate): Coord[] {
	const currentDependencies: Coord[] = [];
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(declaredMove.move);
	const playedObject: ObjectSet = findObject(quantumPos, significantSquares[0])!;
	const filledPos: CompletedPosition = objectsToFilledPosition(quantumPos);
	filledPos.pieces = filledPos.pieces.filter(completedPiece => areCoordsEqual(completedPiece.state, significantSquares[0]) || areOfDifferentObjects(quantumPos, completedPiece.state, significantSquares[0]));
	if (declaredMove.declarations.has(MoveDeclarations.captureOnly) || declaredMove.declarations.has(MoveDeclarations.noCapture) || isEndpointBlocked(declaredMove.move, filledPos)) {
		currentDependencies.push(getCapturedSquare(declaredMove.move));
	}
	if (declaredMove.declarations.has(MoveDeclarations.nonLeaping)) {
		currentDependencies.push(...significantSquares[1].filter(coord => areOfDifferentObjects(quantumPos, coord, significantSquares[0])));
	}
	if (winByCheckmate) {
		currentDependencies.push(...getCheckingDependencies(findObjectFromType(quantumPos, Pieces.king)!.units.map(unit => areCoordsEqual(unit.state, significantSquares[0]) ? significantSquares[2] : discardPromotion(unit.state)), quantumPos, quantumPos.otherData.whoseTurn, declaredMove.move, playedObject));
		if (moveType(declaredMove.move) === SpecialMoves.castle) {
			currentDependencies.push(...getCheckingDependencies([significantSquares[0], significantSquares[1][0]!], quantumPos, quantumPos.otherData.whoseTurn, declaredMove.move, playedObject));
		}
	}
	if (declaredMove.declarations.has(MoveDeclarations.checkOnly) || declaredMove.declarations.has(MoveDeclarations.noCheck)) {
		currentDependencies.push(...getCheckingDependencies(findObjectFromType(quantumPos, Pieces.king, otherSide(quantumPos.otherData.whoseTurn))!.units.map(unit => discardPromotion(unit.state)), quantumPos, otherSide(quantumPos.otherData.whoseTurn), declaredMove.move, playedObject));
	}
	const filteredDependencies: Coord[] = [];
	currentDependencies.forEach(dependency => {
		if (areOfDifferentObjects(quantumPos, significantSquares[0], dependency) && filteredDependencies.every(filteredDependency => !areCoordsEqual(filteredDependency, dependency))) {
			filteredDependencies.push(dependency);
		}
	});
	return filteredDependencies;
}

export function generateRandomDependency(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate): Coord {
	return chooseElement(generateDependencies(declaredMove, quantumPos, winByCheckmate));
}

export function cleanEntanglements(units: PositionedPiece[], makeCopy: boolean = false): PositionedPiece[] {
	const newUnits: PositionedPiece[] = makeCopy ? Fraction.fractionalClone(units) : units;
	newUnits.forEach(unit => unit.entangledTo = unit.entangledTo.filter(entanglesUnit => newUnits.includes(entanglesUnit)));
	return newUnits;
}

export function makeMeasurement(quantumPos: ObjectPosition, dependency: Coord, measurementType: boolean = defaultSettings.measurementType, excludedSide?: keyof typeof Sides, makeCopy: boolean = false): [ObjectPosition, boolean] {
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	const dependentUnit: PositionedPiece = findUnit(newQuantumPos.objects.filter(objectSet => objectSet.pieceType.side !== excludedSide), dependency)!;
	const dependentObject: ObjectSet = newQuantumPos.objects.find(objectSet => objectSet.units.includes(dependentUnit))!;
	const measurementSet: PositionedPiece[] = [dependentUnit, ...dependentObject.units.filter(unit => unit.entangledTo.includes(dependentUnit))];
	const innerProbability: Fraction = Fraction.sum(...measurementSet.map(unit => unit.state.probability));
	if (measurementType) {
		if (random(innerProbability.denominator) < innerProbability.numerator) {
			dependentObject.units.splice(0, dependentObject.units.indexOf(chooseWeightedElement(measurementSet)));
			dependentObject.units.splice(1);
			dependentObject.units[0]!.state.probability = new Fraction;
		} else {
			dependentObject.units.slice().reverse().forEach((unit, unitIndex, reversedArray) => {
				if (measurementSet.includes(unit)) {
					dependentObject.units.splice(reversedArray.length - unitIndex - 1, 1);
				} else {
					unit.state.probability.divide((new Fraction).subtract(innerProbability));
				}
			});
		}
	} else {
		const chosenUnit: PositionedPiece = chooseWeightedElement(measurementSet);
		chosenUnit.state.probability = innerProbability;
		measurementSet.filter(unit => unit !== chosenUnit).forEach(unit => dependentObject.units.splice(dependentObject.units.indexOf(unit), 1));
		if (chosenUnit === dependentUnit) {
			const totalProbability: Fraction = Fraction.sum(...dependentObject.units.map(unit => unit.state.probability));
			if (random(totalProbability.denominator) < totalProbability.numerator) {
				dependentObject.units.splice(0, dependentObject.units.indexOf(chooseWeightedElement(dependentObject.units)));
				dependentObject.units.splice(1);
				dependentObject.units[0]!.state.probability = new Fraction;
			} else {
				newQuantumPos.objects.splice(newQuantumPos.objects.indexOf(dependentObject), 1);
			}
		}
	}
	cleanEntanglements(dependentObject.units);
	return [newQuantumPos, dependentObject.units.some(unit => areCoordsEqual(unit.state, dependency))];
}

export function generateMoveResults(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate, measurementType: boolean = defaultSettings.measurementType, makeCopy: boolean = false): [ObjectPosition, boolean] {
	const startingPoint: Coord = generateStartMiddleEnd(declaredMove.move)[0];
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	const playedObject: ObjectSet = findObject(newQuantumPos, startingPoint)!;
	const unitIndex: number = playedObject.units.findIndex(unit => areCoordsEqual(unit.state, startingPoint));
	while ((possiblePositions => possiblePositions.some(completedPos => isMoveLegal(declaredMove, completedPos, winByCheckmate)) && possiblePositions.some(completedPos => !isMoveLegal(declaredMove, completedPos, winByCheckmate)))(generatePossiblePositions(newQuantumPos, newQuantumPos.objects.indexOf(playedObject), unitIndex))) {
		makeMeasurement(newQuantumPos, generateRandomDependency(declaredMove, newQuantumPos, winByCheckmate), measurementType);
	}
	return [newQuantumPos, isMoveLegal(declaredMove, generatePossiblePositions(newQuantumPos, newQuantumPos.objects.indexOf(playedObject), unitIndex)[0]!, winByCheckmate)];
}

export function generatePlayResults(play: Play, quantumPos: ObjectPosition, settings: GameSettings = defaultSettings, makeCopy: boolean = false): [ObjectPosition, keyof typeof Sounds, boolean] {
	const originalPos: ObjectPosition = Fraction.fractionalClone(quantumPos);
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	let playSound: keyof typeof Sounds = Sounds.invalidated;
	if (!play.primaryMoves.length) {
		newQuantumPos.otherData.whoseTurn = otherSide(quantumPos.otherData.whoseTurn);
		return [newQuantumPos, playSound, false];
	}
	const playedObject: ObjectSet = newQuantumPos.objects[play.objectIndex]!;
	newQuantumPos.otherData.qubits[quantumPos.otherData.whoseTurn === Sides.white ? "whiteBalance" : "blackBalance"] -= calculateQubitCost(play, playedObject, settings.advancedQubitMode);
	const captureDependencies: [Coord, Coord][] = [];
	let newEnpassant: boolean = false;
	let successfullyMoved: boolean = false;
	let castled: boolean = false;
	let promoted: boolean = false;
	let splitMoved: boolean = false;
	playedObject.units.slice().forEach(unit => {
		const localPrimaries: DeclaredMove[] = getLocalMoves(play.primaryMoves, unit.state);
		const localDefault: DeclaredMove | undefined = getLocalMoves(play.defaultMoves, unit.state)[0];
		const defaultBuildup: Fraction = new Fraction(0);
		for (const primaryMove of localPrimaries) {
			if (generateMoveResults(primaryMove, newQuantumPos, settings.winByCheckmate, settings.measurementType)[1]) {
				successfullyMoved = true;
				if (moveType(primaryMove.move) === SpecialMoves.castle) {
					castled = true;
				}
				if ((primaryMove.move as StandardMove).end?.promotion) {
					promoted = true;
				}
				if (localPrimaries.length > 1) {
					splitMoved = true;
				}
				playedObject.units.unshift({
					state: Object.assign(structuredClone(unit.state), {
						probability: Fraction.quotient(unit.state.probability, new Fraction(localPrimaries.length)),
					}),
					entangledTo: [],
				});
				if (isCapture(primaryMove.move, objectsToFilledPosition(newQuantumPos)) && captureDependencies.every(dependency => !areCoordsEqual(dependency[0], generateStartMiddleEnd(primaryMove.move)[2]))) {
					captureDependencies.push([generateStartMiddleEnd(primaryMove.move)[2], getCapturedSquare(primaryMove.move)]);
				}
				makeMove(primaryMove.move, newQuantumPos);
				playedObject.units.push(playedObject.units.splice(0, 1)[0]!);
				if (moveType(primaryMove.move) === SpecialMoves.pawnDoubleMove) {
					newEnpassant = true;
				}
			} else {
				defaultBuildup.add(Fraction.quotient(unit.state.probability, new Fraction(localPrimaries.length)));
			}
		}
		if (localDefault && defaultBuildup.numerator > 0 && generateMoveResults(localDefault, newQuantumPos, settings.winByCheckmate, settings.measurementType)[1]) {
			successfullyMoved = true;
			if (moveType(localDefault.move) === SpecialMoves.castle) {
				castled = true;
			}
			if ((localDefault.move as StandardMove).end?.promotion) {
				promoted = true;
			}
			if (isCapture(localDefault.move, objectsToFilledPosition(newQuantumPos)) && captureDependencies.every(dependency => !areCoordsEqual(dependency[0], generateStartMiddleEnd(localDefault.move)[2]))) {
				captureDependencies.push([generateStartMiddleEnd(localDefault.move)[2], getCapturedSquare(localDefault.move)]);
			}
			makeMove(localDefault.move, newQuantumPos);
			if (moveType(localDefault.move) === SpecialMoves.pawnDoubleMove) {
				newEnpassant = true;
			}
		}
		if (localPrimaries.length) {
			unit.state.probability = defaultBuildup;
			if (unit.state.probability.numerator === 0) {
				playedObject.units.splice(playedObject.units.indexOf(unit), 1);
			}
		}
	});
	const unitBoard: PositionedPiece[][] = Array(64);
	for (let i = 0; i < 64; ++i) {
		unitBoard[i] = [];
	}
	playedObject.units.forEach(unit => unitBoard[coordToIndex(unit.state)]!.push(unit));
	unitBoard.filter(unitArray => unitArray.length > 1).forEach(unitArray => {
		unitArray[0]!.state.probability = Fraction.sum(...unitArray.map(unit => unit.state.probability));
		unitArray.slice(1).forEach(unit => playedObject.units.splice(playedObject.units.indexOf(unit), 1));
	});
	cleanEntanglements(playedObject.units);
	for (const captureDependency of captureDependencies) {
		if (findUnit(getSide(newQuantumPos, quantumPos.otherData.whoseTurn), captureDependency[0]) && (!measurePartiallyCaptured(findObject(quantumPos, captureDependency[1])!.pieceType.type_p) || makeMeasurement(newQuantumPos, captureDependency[1], settings.measurementType, quantumPos.otherData.whoseTurn)[1]) && makeMeasurement(newQuantumPos, captureDependency[0], settings.measurementType, otherSide(quantumPos.otherData.whoseTurn))[1]) {
			const capturedUnit: PositionedPiece = findUnit(getSide(newQuantumPos, otherSide(quantumPos.otherData.whoseTurn)), captureDependency[1])!;
			const capturedObject: ObjectSet = newQuantumPos.objects.find(objectSet => objectSet.units.includes(capturedUnit))!;
			capturedObject.units.splice(capturedObject.units.indexOf(capturedUnit), 1);
			cleanEntanglements(capturedObject.units);
			if (!capturedObject.units.length) {
				newQuantumPos.objects.splice(newQuantumPos.objects.indexOf(capturedObject), 1);
			}
		}
	}
	newQuantumPos.otherData.qubits[quantumPos.otherData.whoseTurn === Sides.white ? "whiteBalance" : "blackBalance"] += calculateBoardValue(originalPos, settings.partialQubitRewards) - calculateBoardValue(newQuantumPos, settings.partialQubitRewards);
	(qubitAmount => {
		if (Math.abs(qubitAmount - Math.round(qubitAmount)) < epsilon) {
			newQuantumPos.otherData.qubits[quantumPos.otherData.whoseTurn === Sides.white ? "whiteBalance" : "blackBalance"] = Math.round(qubitAmount);
		}
	})(getRespectiveQubitAmount(newQuantumPos.otherData));
	if (!newEnpassant) {
		newQuantumPos.otherData.enpassant = false;
	}
	const castleValues: [boolean, boolean, boolean, boolean] = getCastleValues(objectsToGamePosition(newQuantumPos));
	newQuantumPos.otherData.castling.canWhiteCastleLeft  &&= castleValues[0];
	newQuantumPos.otherData.castling.canWhiteCastleRight &&= castleValues[1];
	newQuantumPos.otherData.castling.canBlackCastleLeft  &&= castleValues[2];
	newQuantumPos.otherData.castling.canBlackCastleRight &&= castleValues[3];
	newQuantumPos.otherData.whoseTurn = otherSide(quantumPos.otherData.whoseTurn);
	if (settings.winByCheckmate) {
		const kingUnits: PositionedPiece[] = findObjectFromType(newQuantumPos, Pieces.king)!.units;
		kingUnits.slice().forEach(unit => {
			while (kingUnits.includes(unit) && getCheckingDependencies([unit.state], newQuantumPos, newQuantumPos.otherData.whoseTurn).length) {
				makeMeasurement(newQuantumPos, chooseElement(getCheckingDependencies([unit.state], newQuantumPos, newQuantumPos.otherData.whoseTurn)));
			}
		});
	}
	if (successfullyMoved) {
		playSound = Sounds.move;
	}
	if (castled) {
		playSound = Sounds.castle;
	}
	if (promoted) {
		playSound = Sounds.promote;
	}
	if (splitMoved) {
		playSound = Sounds.split;
	}
	if (calculateBoardValue(originalPos, true) - calculateBoardValue(newQuantumPos, true, newQuantumPos.otherData.whoseTurn) > epsilon || getSide(originalPos, newQuantumPos.otherData.whoseTurn).length > getSide(newQuantumPos).length) {
		playSound = Sounds.capture;
	};
	if (settings.winByCheckmate && isInCheck(objectsToFilledPosition(quantumPos))) {
		playSound = Sounds.check;
	}
	return [newQuantumPos, playSound, settings.winByCheckmate ? detectCheckmate(newQuantumPos) : !findObjectFromType(newQuantumPos, Pieces.king)];
}

export function candidateMoves(unit: PositionedPiece, quantumPos: ObjectPosition, side: keyof typeof Sides = quantumPos.objects.find(objectSet => objectSet.units.includes(unit))!.pieceType.side): DeclaredMove[] {
	const rawType: keyof typeof Pieces = getUnitType(quantumPos, unit);
	const currentMoves: Move[] = chessboard.map(coord => rawType === Pieces.pawn && coord.y === promotionRank(side) ? {
		start: discardPromotion(unit.state),
		end: Object.assign(structuredClone(coord), {
			promotion: Pieces.queen,
		}),
	} : {
		start: discardPromotion(unit.state),
		end: structuredClone(coord),
	}).filter(move => isInRange(move, rawType, side));
	if (quantumPos.otherData.enpassant && !findUnit(getSide(quantumPos, otherSide(side)), quantumPos.otherData.enpassant)) {
		const removeIndex: number = currentMoves.findIndex(move => areCoordsEqual((move as StandardMove).end, quantumPos.otherData.enpassant as Coord));
		if (removeIndex !== -1) {
			currentMoves.push({
				attackingPawn: discardPromotion(unit.state),
				captureSquare: structuredClone(quantumPos.otherData.enpassant),
			});
			currentMoves.splice(removeIndex, 1);
		}
	}
	if (rawType === Pieces.pawn && unit.state.y === pawnRank(side)) {
		currentMoves.push({ pushedPawn: discardPromotion(unit.state) });
	}
	if (rawType === Pieces.king) {
		if (side === Sides.white) {
			if (quantumPos.otherData.castling.canWhiteCastleLeft) {
				currentMoves.push({
					side: Sides.white,
					direction: -1,
				});
			}
			if (quantumPos.otherData.castling.canWhiteCastleRight) {
				currentMoves.push({
					side: Sides.white,
					direction: 1,
				});
			}
		} else {
			if (quantumPos.otherData.castling.canBlackCastleLeft) {
				currentMoves.push({
					side: Sides.black,
					direction: -1,
				});
			}
			if (quantumPos.otherData.castling.canBlackCastleRight) {
				currentMoves.push({
					side: Sides.black,
					direction: 1,
				});
			}
		}
	}
	return currentMoves.map(candidateMove => ({
		move: candidateMove,
		declarations: getRequiredDeclarations(candidateMove, rawType),
	}));
}

export function detectCheckmate(quantumPos: ObjectPosition, whoseTurn: keyof typeof Sides = quantumPos.otherData.whoseTurn): boolean {
	if (!isInCheck(generatePossiblePositions(quantumPos)[0]!, whoseTurn)) {
		return false;
	}
	for (const objectSet of getSide(quantumPos)) {
		if (objectSet.units.every(unit => candidateMoves(unit, quantumPos).some(candidateMove => isMoveAlwaysLegal(candidateMove, quantumPos, true)))) {
			return false;
		}
	};
	return true;
}

export function initializeObjectPosition(unlimitedQubits: boolean = defaultSettings.unlimitedQubits): ObjectPosition {
	const initialPos: ObjectPosition = completedPositionToObjects(defaultPosition);
	if (unlimitedQubits) {
		initialPos.otherData.qubits.whiteBalance = Infinity;
		initialPos.otherData.qubits.blackBalance = Infinity;
	}
	return initialPos;
}

export function getObjectsString(objectPosition: ObjectPosition): string {
	let positionString: string = getDataString(objectPosition.otherData);
	objectPosition.objects.forEach(objectSet => {
		let objectString: string = "";
		let entanglementString: string = "";
		objectSet.units.forEach(unit => {
			objectString += ` (${coordserialize(unit.state)},${unit.state.probability.serialize() + (unit.state.promotion ? "," + unit.state.promotion : "")}),`;
			unit.entangledTo.forEach(entanglesUnit => entanglementString += ` <${objectSet.units.indexOf(unit)}-${objectSet.units.indexOf(entanglesUnit)}>,`);
		});
		positionString += `|${objectSet.pieceType.type_p + objectSet.pieceType.side[0]!.toUpperCase()}:${(objectString + entanglementString).slice(0, -1)}`;
	});
	return positionString;
}

export function getObjectsFromString(positionString: string): ObjectPosition {
	const components: string[] = positionString.split("|");
	const currentObjects: ObjectSet[] = [];
	for (const objectString of components.slice(1)) {
		const currentUnits: PositionedPiece[] = [];
		const segments: string[] = objectString.split(" ");
		for (const segment of segments.slice(1)) {
			if (segment[0] === "(") {
				currentUnits.push({
					state: decodeSegment(segment),
					entangledTo: [],
				});
			} else {
				currentUnits[parseInt(segment.split("-")[0]!.slice(1))]!.entangledTo.push(currentUnits[parseInt(segment.split("-")[1]!)]!);
			}
		}
		currentObjects.push({
			pieceType: {
				type_p: segments[0]!.slice(0, -2) as keyof typeof Pieces,
				side: segments[0]!.at(-2) === "W" ? Sides.white : Sides.black,
			},
			units: currentUnits,
		});
	}
	return {
		objects: currentObjects,
		otherData: getDataFromString(components[0]!),
	};
}

export function validStartingObjectsCheck(objectPosition: ObjectPosition): boolean {
	try {
		new ChessboardPosition(objectPosition.objects);
	} catch {
		return false;
	}
	return [objectPosition.otherData.qubits.whiteBalance, objectPosition.otherData.qubits.blackBalance].every(amount => amount >= 0) &&
	       objectPosition.objects.every(objectSet => objectSet.units.reduce((accumulator, current) => ({
		       state: {
			       x: 1,
			       y: 1,
			       probability: Fraction.sum(accumulator.state.probability, current.state.probability),
		       },
		       entangledTo: [],
	       })).state.probability.lessThanOrEqualTo(new Fraction) && objectSet.units.every(unit => unit.state.probability.numerator > 0 && unit.state.probability.denominator > 0) && (objectSet.pieceType.type_p !== Pieces.pawn || objectSet.units.every(unit => (![1, 8].includes(unit.state.y) || unit.state.promotion) && validPromotions.has(unit.state.promotion))) && (objectSet.pieceType.type_p === Pieces.pawn || objectSet.units.every(unit => unit.state.promotion === undefined))) &&
	       (!objectPosition.otherData.enpassant || isCoord(objectPosition.otherData.enpassant) && [3, 6].includes(objectPosition.otherData.enpassant.y) && objectPosition.objects.some(objectSet => objectSet.pieceType.type_p === Pieces.pawn && objectSet.pieceType.side === otherSide(objectPosition.otherData.whoseTurn)  && objectSet.units.some(unit => !unit.state.promotion && areCoordsEqual(translateCoord(unit.state, 0, enpassantDisplacement(objectPosition.otherData.whoseTurn), true), objectPosition.otherData.enpassant as Coord)))) &&
	       (!objectPosition.otherData.castling.canWhiteCastleLeft  || getCastleValues(objectsToGamePosition(objectPosition))[0]) &&
	       (!objectPosition.otherData.castling.canWhiteCastleRight || getCastleValues(objectsToGamePosition(objectPosition))[1]) &&
	       (!objectPosition.otherData.castling.canBlackCastleLeft  || getCastleValues(objectsToGamePosition(objectPosition))[2]) &&
	       (!objectPosition.otherData.castling.canBlackCastleRight || getCastleValues(objectsToGamePosition(objectPosition))[3]);
}

export function isValidStartingObjectsString(candidateString: string) {
	try {
		return validStartingObjectsCheck(getObjectsFromString(candidateString)) && getObjectsString(getObjectsFromString(candidateString)) === candidateString;
	} catch {
		return false;
	}
}

export function areValidStartingObjects(candidatePosition: ObjectPosition): boolean {
	try {
		return isValidStartingObjectsString(getObjectsString(candidatePosition));
	} catch {
		return false;
	}
}
