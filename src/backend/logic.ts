import Fraction from "./arithmetic.js";
import assert from "assert";
import { actualType, addProbability, allDeclarations, areCoordsEqual, areOfDifferentObjects, completedPositionToObjects, defaultData, discardPromotion, discardProbability, enpassantDisplacement, findObject, findObjectFromType, findPiece, findPieceFromType, findUnit, getCastleProperty, getRespectiveQubitAmount, getTypeOfMove, isStandardMove, objectsToFilledPosition, otherSide, translateCoord, getCoordType, CastleMove, CompletedPosition, CompletedSet, Coord, DeclaredMove, Enpassant, GameData, Move, MoveDeclarations, ObjectPosition, ObjectSet, PartialCoord, PawnDoubleMove, Pieces, Play, PositionedPiece, Sides, SpecialMoves, StandardMove} from "./piecetypes.js";
import { defaultSettings, getAllowedDeclarations, getCastleValues, objectsToGamePosition, Settings} from "./metatypes.js";
import { chooseWeightedElement, random } from "./random.js";

export const epsilon: number = 1e-12 as const;

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
		switch (getTypeOfMove(move)) {
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
	return findPiece(completedPos, significantSquares[0])!.pieceType.side === findPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function isCapture(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	return otherSide(findPiece(completedPos, significantSquares[0])!.pieceType.side) === findPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function getLeapCheckingPieces(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord: Coord | undefined = findPieceFromType(completedPos, Pieces.king, whoseTurn)?.state): CompletedSet[] {
	return kingCoord ? completedPos.pieces.filter(completedPiece => completedPiece.pieceType.side === otherSide(whoseTurn) && isInRange({
		start: completedPiece.state,
		end: kingCoord,
	}, completedPiece) && !(actualType(completedPiece) === Pieces.pawn && completedPiece.state.y === kingCoord.y)) : [];
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
	const findFunction: any = "pieces" in position ? findPiece : findUnit;
	if (isStandardMove(move)) {
		Object.assign(findFunction(position, move.start)!.state, move.end);
	} else {
		switch (getTypeOfMove(move)) {
			case SpecialMoves.castle:
				findFunction(position, {
					x: 5,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.state.x += 2 * (move as CastleMove).direction;
				findFunction(position, {
					x: 4.5 + 3.5 * (move as CastleMove).direction as PartialCoord,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.state.x += 0.5 - 2.5 * (move as CastleMove).direction;
				break;
			case SpecialMoves.enpassant:
				Object.assign(findFunction(position, (move as Enpassant).attackingPawn)!.state, (move as Enpassant).captureSquare);
				break;
			case SpecialMoves.pawnDoubleMove:
				(pawnCoord => {
					if (position.otherData) {
						position.otherData.enpassant = translateCoord(discardPromotion(pawnCoord), 0, enpassantDisplacement(position.otherData.whoseTurn));
					}
					pawnCoord.y = (pawnCoord.y - 4.5) / 5 + 4.5 as PartialCoord;
				})(findFunction(position, (move as PawnDoubleMove).pushedPawn)!.state);
				break;
			default:
				throw new Error("Unidentified move passed into 'getResultOfMove'");
		}
	}
}

export function getResultOfMove(move: Move, completedPos: CompletedPosition, makeCopy: boolean = false): CompletedPosition {
	const newCompletedPos: CompletedPosition = makeCopy ? structuredClone(completedPos) : completedPos;
	const endpoint: Coord = generateStartMiddleEnd(move)[2];
	const captureIndex: number = newCompletedPos.pieces.findIndex(completedPiece => areCoordsEqual(completedPiece.state, endpoint));
	if (captureIndex !== -1) {
		newCompletedPos.pieces.splice(captureIndex, 1);
	}
	if (newCompletedPos.otherData) {
		newCompletedPos.otherData.enpassant = false;
	}
	makeMove(move, completedPos);
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
	const current: Set<keyof typeof MoveDeclarations> = new Set;
	if (rawType === Pieces.pawn) {
		const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
		current.add(significantSquares[0].x === significantSquares[2].x ? MoveDeclarations.noCapture : MoveDeclarations.captureOnly);
	}
	if (rawType !== Pieces.knight) {
		current.add("nonLeaping");
	}
	return current;
}

export function isMoveLegal(declaredMove: DeclaredMove, completedPos: CompletedPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate, data: GameData = completedPos.otherData ?? defaultData): boolean {
	let significantSquares: [Coord, Coord[], Coord];
	try {
		significantSquares = generateStartMiddleEnd(declaredMove.move);
	} catch {
		return false;
	}
	const movedPiece: CompletedSet | undefined = findPiece(completedPos, significantSquares[0]);
	if (!(movedPiece && (getTypeOfMove(declaredMove.move) || isStandardMove(declaredMove.move) && isInRange(declaredMove.move, movedPiece) && (!declaredMove.move.end.promotion || declaredMove.move.end.y === (data.whoseTurn === Sides.white ? 8 : 1) && actualType(movedPiece) === Pieces.pawn)))) {
		return false;
	}
	const result: CompletedPosition = getResultOfMove(declaredMove.move, completedPos, true);
	let current: boolean = movedPiece.pieceType.side === data.whoseTurn &&
	                       !isEndpointBlocked(declaredMove.move, completedPos) &&
	                       !(winByCheckmate && isInCheck(result, data.whoseTurn)) &&
	                       declaredMove.declarations.isSubsetOf(allDeclarations) &&
	                       declaredMove.declarations.isSupersetOf(getRequiredDeclarations(declaredMove.move, actualType(movedPiece))) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.nonLeaping) && isBlocked(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCapture) && isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.captureOnly) && !isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCheck) && isInCheck(result, otherSide(data.whoseTurn))) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.checkOnly) && !isInCheck(result, otherSide(data.whoseTurn)));
	switch (getTypeOfMove(declaredMove.move)) {
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
			current &&= actualType(movedPiece) === Pieces.pawn && movedPiece.state.y === (data.whoseTurn === Sides.white ? 2 : 7);
	}
	return current;
}

export function generatePossiblePositions(quantumPos: ObjectPosition, fixedObjectIndex?: number, fixedUnitIndex?: number): CompletedPosition[] {
	const completedPositions: CompletedPosition[] = [];
	const currentIndexes: number[] = Array(quantumPos.objects.length).fill(0);
	const limitIndexes: number[] = quantumPos.objects.map(objectSet => objectSet.units.length);
	if (fixedObjectIndex && fixedUnitIndex) {
		currentIndexes[fixedObjectIndex] = fixedUnitIndex;
	}
	let pointer: number = 0;
	while (pointer >= 0) {
		completedPositions.push({
			pieces: quantumPos.objects.map((objectSet, objectIndex) => ({
				pieceType: structuredClone(objectSet.pieceType),
				state: discardProbability(objectSet.units[currentIndexes[objectIndex]!]!.state),
			})),
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

export function getLocalMoves(declaredMoves: DeclaredMove[], coord: Coord): DeclaredMove[] {
	return declaredMoves.filter(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], coord));
}

export function calculateQubitCost(play: Play, quantumPos: ObjectPosition, advancedQubitMode: boolean): number {
	let current: number = 0;
	for (const unit of quantumPos.objects[play.objectIndex]!.units) {
		const moveTotal = getLocalMoves([...play.primaryMoves, ...play.defaultMoves], unit.state).length;
		if (moveTotal > 1) {
			if (advancedQubitMode) {
				current += Math.sqrt(unit.state.probability.value()) * (Math.sqrt(moveTotal) - 1);
			} else {
				current += moveTotal - 1;
			}
		}
	}
	return current;
}

export function checkPlayValidity(play: Play, quantumPos: ObjectPosition, settings: Settings = defaultSettings): Set<string> {
	const playedObject: ObjectSet | undefined = quantumPos.objects[play.objectIndex];
	assert(playedObject && playedObject.pieceType.side === quantumPos.otherData.whoseTurn, "Invalid object index passed into 'isPlayLegal'");
	const problems: Set<string> = new Set;
	if (!play.primaryMoves.length) {
		problems.add("Null plays are not allowed");
	}
	if (play.primaryMoves.filter(declaredMove => getTypeOfMove(declaredMove.move) === "pawnDoubleMove").length > 1) {
		problems.add("Only one pawn double move per play");
	}
	const unitPositions: Set<string> = new Set(playedObject.units.map(unit => JSON.stringify(discardPromotion(unit.state))));
	if (play.primaryMoves.some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add("One or more primary moves are impossible");
	}
	if (play.defaultMoves.some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add("One or more default moves are impossible");
	}
	if ([...play.primaryMoves, ...play.defaultMoves].some(declaredMove => !declaredMove.declarations.difference(getRequiredDeclarations(declaredMove.move, getCoordType(quantumPos, generateStartMiddleEnd(declaredMove.move)[0])!)).isSubsetOf(getAllowedDeclarations(settings)))) {
		problems.add("One or more external declarations are not allowed in settings");
	}
	if (getRespectiveQubitAmount(quantumPos.otherData) - calculateQubitCost(play, quantumPos, settings.advancedQubitMode) < epsilon) {
		problems.add("Not enough qubits");
	}
	playedObject.units.forEach((unit, unitIndex) => {
		const localPrimaries: DeclaredMove[] = getLocalMoves(play.primaryMoves, unit.state);
		const localDefaults: DeclaredMove[] = getLocalMoves(play.defaultMoves, unit.state);
		if (localDefaults.length > 1) {
			problems.add("Only one default move per unit");
		}
		if (!settings.allowCastling && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.castle)) {
			problems.add("Castling is not allowed in settings");
		}
		if (!settings.castleSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.castle)) {
			problems.add("Making a split move while castling is not allowed in settings");
		}
		if (!settings.pawnDoubleMoveSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.pawnDoubleMove)) {
			problems.add("Making a split move with a pawn double move is not allowed in settings");
		}
		if (settings.winByCheckmate && generatePossiblePositions(quantumPos, play.objectIndex, unitIndex).some(completedPos => isInCheck(completedPos) && !(localDefaults[0] && isMoveLegal(localDefaults[0], completedPos, true)) && localPrimaries.some(declaredMove => !isMoveLegal(declaredMove, completedPos, true)))) {
			problems.add("Play is illegal (see the win by checkmate exception)");
		}
	});
	return problems;
}

export function isPlayLegal(play: Play, quantumPos: ObjectPosition, settings: Settings = defaultSettings) {
	return !checkPlayValidity(play, quantumPos, settings).size;
}

export function generateDependencies(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate): Coord[] {
	const currentDependencies: Coord[] = [];
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(declaredMove.move);
	const playedObject: ObjectSet = findObject(quantumPos, significantSquares[0])!;
	const filledPos: CompletedPosition = objectsToFilledPosition(quantumPos);
	filledPos.pieces = filledPos.pieces.filter(completedPiece => areCoordsEqual(completedPiece.state, significantSquares[0]) || areOfDifferentObjects(quantumPos, completedPiece.state, significantSquares[0]));
	if (declaredMove.declarations.has("captureOnly") || declaredMove.declarations.has("noCapture") || isEndpointBlocked(declaredMove.move, filledPos)) {
		currentDependencies.push(translateCoord(significantSquares[2], 0, getTypeOfMove(declaredMove.move) === SpecialMoves.enpassant ? quantumPos.otherData.whoseTurn === Sides.white ? -1 : 1 : 0));
	}
	if (declaredMove.declarations.has("nonLeaping")) {
		currentDependencies.push(...significantSquares[1].filter(coord => areOfDifferentObjects(quantumPos, coord, significantSquares[0])));
	}
	getResultOfMove(declaredMove.move, filledPos);
	function getCheckingDependencies(checkedCoords: Coord[], side: keyof typeof Sides): Coord[] {
		return checkedCoords.flatMap(checkedCoord => getLeapCheckingPieces(filledPos, side, checkedCoord).flatMap(checkingPiece => ((possiblePositions, predicate) => {
			possiblePositions.forEach(completedPos => getResultOfMove(declaredMove.move, completedPos));
			return possiblePositions.some(completedPos => predicate(completedPos)) && possiblePositions.some(completedPos => !predicate(completedPos));
		})(generatePossiblePositions(quantumPos, quantumPos.objects.indexOf(playedObject), playedObject.units.findIndex(unit => areCoordsEqual(unit.state, significantSquares[0]))), ((completedPos: CompletedPosition) => !!findPiece(completedPos, checkedCoord) && !!findPiece(completedPos, checkingPiece.state) && !isBlocked({
			start: checkingPiece.state,
			end: checkedCoord,
		}, completedPos))) ? (actualType(checkingPiece) === Pieces.knight ? [] : getBlockingPieces({
			start: checkingPiece.state,
			end: checkedCoord,
		}, filledPos).map(blockingPiece => discardPromotion(blockingPiece.state))).concat(checkedCoord, discardPromotion(checkingPiece.state)) : []));
	}
	if (winByCheckmate) {
		currentDependencies.push(...getCheckingDependencies(findObjectFromType(quantumPos, Pieces.king, quantumPos.otherData.whoseTurn)!.units.map(unit => discardPromotion(unit.state)), quantumPos.otherData.whoseTurn));
		if (getTypeOfMove(declaredMove.move) === SpecialMoves.castle) {
			currentDependencies.push(...getCheckingDependencies([significantSquares[0], significantSquares[1][0]!], quantumPos.otherData.whoseTurn));
		}
	}
	if (declaredMove.declarations.has("noCheck") || declaredMove.declarations.has("checkOnly")) {
		currentDependencies.push(...getCheckingDependencies(findObjectFromType(quantumPos, Pieces.king, otherSide(quantumPos.otherData.whoseTurn))!.units.map(unit => discardPromotion(unit.state)), otherSide(quantumPos.otherData.whoseTurn)));
	}
	const filteredDependencies: Coord[] = [];
	currentDependencies.forEach(dependency => {
		if (areOfDifferentObjects(quantumPos, significantSquares[0], dependency) && filteredDependencies.every(filteredDependency => !areCoordsEqual(filteredDependency, dependency))) {
			filteredDependencies.push(dependency);
		}
	});
	return filteredDependencies;
}

export function cleanEntanglements(units: PositionedPiece[], makeCopy: boolean = false): PositionedPiece[] {
	const newUnits: PositionedPiece[] = makeCopy ? Fraction.fractionalClone(units) : units;
	const unitPositions: Set<string> = new Set(units.map(unit => JSON.stringify(discardPromotion(unit.state))));
	newUnits.forEach(unit => unit.entangledTo = unit.entangledTo.filter(entangledCoord => unitPositions.has(JSON.stringify(entangledCoord))));
	return newUnits;
}

export function makeMeasurement(quantumPos: ObjectPosition, measurementType: boolean = defaultSettings.measurementType, dependency: Coord, makeCopy: boolean = false): ObjectPosition {
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	const dependentUnit: PositionedPiece = findUnit(newQuantumPos, dependency)!;
	const dependentObject: ObjectSet = findObject(newQuantumPos, dependency)!;
	const measurementSet: PositionedPiece[] = [dependentUnit, ...dependentUnit.entangledTo.map(entangledCoord => findUnit(newQuantumPos, entangledCoord)!)];
	const innerProbability: Fraction = Fraction.sum(...measurementSet.map(unit => unit.state.probability));
	if (measurementType) {
		if (random(innerProbability.denominator) < innerProbability.numerator) {
			dependentObject.units.splice(0, dependentObject.units.indexOf(chooseWeightedElement(measurementSet)));
			dependentObject.units.splice(1);
			addProbability(dependentObject.units[0]!.state);
		} else {
			dependentObject.units.slice().reverse().forEach((unit, unitIndex, reversedArray) => {
				if (measurementSet.includes(unit)) {
					dependentObject.units.splice(reversedArray.length - unitIndex - 1, 1);
				} else {
					unit.state.probability.divide(Fraction.difference(new Fraction, innerProbability));
				}
			});
		}
	} else {
		const selectedUnit: PositionedPiece = chooseWeightedElement(measurementSet);
		selectedUnit.state.probability = innerProbability;
		measurementSet.filter(unit => unit !== selectedUnit).forEach(unit => dependentObject.units.splice(dependentObject.units.indexOf(unit), 1));
		if (selectedUnit === dependentUnit) {
			const totalProbability: Fraction = Fraction.sum(...dependentObject.units.map(unit => unit.state.probability));
			if (random(totalProbability.denominator) < totalProbability.numerator) {
				dependentObject.units.splice(0, dependentObject.units.indexOf(chooseWeightedElement(dependentObject.units)));
				dependentObject.units.splice(1);
				addProbability(dependentObject.units[0]!.state);
			} else {
				newQuantumPos.objects.splice(newQuantumPos.objects.indexOf(dependentObject), 1);
			}
		}
	}
	cleanEntanglements(dependentObject.units);
	return newQuantumPos;
}

export function generateMoveResults(declaredMove: DeclaredMove, quantumPos: ObjectPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate, measurementType: boolean = defaultSettings.measurementType, dependencies: Coord[] = generateDependencies(declaredMove, quantumPos, winByCheckmate), makeCopy: boolean = false): [ObjectPosition, boolean] {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(declaredMove.move);
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	const playedObject: ObjectSet = findObject(newQuantumPos, significantSquares[0])!;
	const possiblePositions: CompletedPosition[] = generatePossiblePositions(quantumPos, quantumPos.objects.indexOf(playedObject), playedObject.units.findIndex(unit => areCoordsEqual(unit.state, significantSquares[0])));
	while (possiblePositions.some(completedPos => isMoveLegal(declaredMove, completedPos, winByCheckmate)) && possiblePositions.some(completedPos => !isMoveLegal(declaredMove, completedPos, winByCheckmate))) {
		makeMeasurement(newQuantumPos, measurementType, dependencies.splice(random(dependencies.length), 1)[0]!);
	}
	return [newQuantumPos, isMoveLegal(declaredMove, possiblePositions[0]!, winByCheckmate)];
}

/*export function generatePlayResults(play: Play, quantumPos: ObjectPosition, settings: Settings = defaultSettings, makeCopy: boolean = false): ObjectPosition {
	const newQuantumPos: ObjectPosition = makeCopy ? Fraction.fractionalClone(quantumPos) : quantumPos;
	const playedObject: ObjectSet = quantumPos.objects[play.objectIndex]!;
	newQuantumPos.otherData.enpassant = false;
	playedObject.units.forEach(unit => {
		const localPrimaries: DeclaredMove[] = play.primaryMoves.filter(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], unit.state));
		const localDefault: DeclaredMove | undefined = play.defaultMoves.find(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], unit.state));
		const defaultBuildup: Fraction = new Fraction(0);
		for (const primaryMove of localPrimaries) {
			const movedUnit: PositionedPiece = findUnit(newQuantumPos, generateStartMiddleEnd(primaryMove.move)[0])!;
			if (generateMoveResults(primaryMove, newQuantumPos, settings.winByCheckmate, settings.measurementType)[1]) {

			} else {
				defaultBuildup.add(movedUnit.state.probability);
			}
		}
	});
	newQuantumPos.otherData.whoseTurn = otherSide(newQuantumPos.otherData.whoseTurn);
	const castleValues: [boolean, boolean, boolean, boolean] = getCastleValues(objectsToGamePosition(newQuantumPos));
	newQuantumPos.otherData.castling.canWhiteCastleLeft  &&= castleValues[0];
	newQuantumPos.otherData.castling.canWhiteCastleRight &&= castleValues[1];
	newQuantumPos.otherData.castling.canBlackCastleLeft  &&= castleValues[2];
	newQuantumPos.otherData.castling.canBlackCastleRight &&= castleValues[3];
}*/
