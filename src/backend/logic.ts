import Fraction from "./arithmetic.js";
import assert from "assert";
import { actualType, /*addProbability,*/ allDeclarations, areCoordsEqual, areOfDifferentObjects, completedPositionToObjects, defaultData, discardPromotion, discardProbability, findObjectSet, findObjectSetFromType, findPiece, findPieceFromType, /*findUnit,*/ getCastleProperty, getTypeOfMove, isStandardMove, objectsToFilledPosition, otherSide, CastleMove, CompletedPosition, CompletedSet, Coord, DeclaredMove, Enpassant, GameData, Move, MoveDeclarations, ObjectPosition, ObjectSet, PartialCoord, PawnDoubleMove, Pieces, Play, PositionedPiece, Sides, SpecialMoves, StandardMove} from "./piecetypes.js";
import { defaultSettings, getCastleValues, objectsToGamePosition, Settings} from "./metatypes.js";

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
	const occupiedSquares: Set<string> = new Set(completedPos.pieces.map(completedPiece => JSON.stringify(discardPromotion(completedPiece.position))));
	return generateStartMiddleEnd(move)[1].some(square => occupiedSquares.has(JSON.stringify(square)));
}

export function getBlockingPieces(move: Move, completedPos: CompletedPosition): CompletedSet[] {
	const middleSquares: Set<string> = new Set(generateStartMiddleEnd(move)[1].map(coord => JSON.stringify(coord)));
	return completedPos.pieces.filter(completedPiece => middleSquares.has(JSON.stringify(discardPromotion(completedPiece.position))));
}

export function isEndpointBlocked(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	return findPiece(completedPos, significantSquares[0])!.pieceType.side === findPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function isCapture(move: Move, completedPos: CompletedPosition): boolean {
	const significantSquares: [Coord, Coord[], Coord] = generateStartMiddleEnd(move);
	return otherSide(findPiece(completedPos, significantSquares[0])!.pieceType.side) === findPiece(completedPos, significantSquares[2])?.pieceType?.side;
}

export function getLeapCheckingPieces(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord: Coord | undefined = findPieceFromType(completedPos, Pieces.king, whoseTurn)?.position): CompletedSet[] {
	return kingCoord ? completedPos.pieces.filter(completedPiece => completedPiece.pieceType.side === otherSide(whoseTurn) && isInRange({
		start: completedPiece.position,
		end: kingCoord,
	}, completedPiece) && !(actualType(completedPiece) === Pieces.pawn && completedPiece.position.y === kingCoord.y)) : [];
}

export function getCheckingPieces(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord: Coord | undefined = findPieceFromType(completedPos, Pieces.king, whoseTurn)?.position): CompletedSet[] {
	return kingCoord ? getLeapCheckingPieces(completedPos, whoseTurn, kingCoord).filter(completedPiece => actualType(completedPiece) === Pieces.knight || !isBlocked({
		start: completedPiece.position,
		end: kingCoord,
	}, completedPos)) : [];
}

export function isInCheck(completedPos: CompletedPosition, whoseTurn: keyof typeof Sides = completedPos.otherData?.whoseTurn ?? defaultData.whoseTurn, kingCoord?: Coord): boolean {
	return !!getCheckingPieces(completedPos, whoseTurn, kingCoord).length;
}

export function getResultOfMove(move: Move, completedPos: CompletedPosition, makeCopy: boolean = false): CompletedPosition {
	const newCompletedPos = makeCopy ? structuredClone(completedPos) : completedPos;
	const endpoint: Coord = generateStartMiddleEnd(move)[2];
	const captureIndex: number = newCompletedPos.pieces.findIndex(completedPiece => areCoordsEqual(completedPiece.position, endpoint));
	if (captureIndex !== -1) {
		newCompletedPos.pieces.splice(captureIndex, 1);
	}
	if (newCompletedPos.otherData) {
		newCompletedPos.otherData.enpassant = false;
	}
	if (isStandardMove(move)) {
		Object.assign(findPiece(newCompletedPos, move.start)!.position, move.end);
	} else {
		switch (getTypeOfMove(move)) {
			case SpecialMoves.castle:
				findPiece(newCompletedPos, {
					x: 5,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.position.x += 2 * (move as CastleMove).direction;
				findPiece(newCompletedPos, {
					x: 4.5 + 3.5 * (move as CastleMove).direction as PartialCoord,
					y: (move as CastleMove).side === Sides.white ? 1 : 8,
				})!.position.x += 0.5 - 2.5 * (move as CastleMove).direction;
				break;
			case SpecialMoves.enpassant:
				Object.assign(findPiece(newCompletedPos, (move as Enpassant).attackingPawn)!.position, (move as Enpassant).captureSquare);
				break;
			case SpecialMoves.pawnDoubleMove:
				(pawnCoord => {
					pawnCoord.y = (pawnCoord.y - 4.5) / 5 + 4.5 as PartialCoord;
					if (newCompletedPos.otherData) {
						newCompletedPos.otherData.enpassant = discardPromotion(pawnCoord);
					}
				})(findPiece(newCompletedPos, (move as PawnDoubleMove).pushedPawn)!.position);
				break;
			default:
				throw new Error("Unidentified move passed into 'getResultOfMove'");
		}
	}
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

export function isMoveLegal(declaredMove: DeclaredMove, completedPos: CompletedPosition, winByCheckmate: boolean = defaultSettings.winByCheckmate, data: GameData = completedPos.otherData ?? defaultData): boolean {
	let significantSquares: [Coord, Coord[], Coord];
	try {
		significantSquares = generateStartMiddleEnd(declaredMove.move);
	} catch {
		return false;
	}
	const movedPiece = findPiece(completedPos, significantSquares[0]);
	if (!(movedPiece && (getTypeOfMove(declaredMove.move) || isStandardMove(declaredMove.move) && isInRange(declaredMove.move, movedPiece) && (!declaredMove.move.end.promotion || declaredMove.move.end.y === (data.whoseTurn === Sides.white ? 8 : 1) && actualType(movedPiece) === Pieces.pawn)))) {
		return false;
	}
	const result: CompletedPosition = getResultOfMove(declaredMove.move, completedPos, true);
	let current: boolean = movedPiece.pieceType.side === data.whoseTurn &&
	                       !isEndpointBlocked(declaredMove.move, completedPos) &&
	                       !(winByCheckmate && isInCheck(result, data.whoseTurn)) &&
	                       declaredMove.declarations.isSubsetOf(allDeclarations) &&
	                       (actualType(movedPiece) === Pieces.knight || declaredMove.declarations.has(MoveDeclarations.nonLeaping)) &&
	                       (actualType(movedPiece) !== Pieces.pawn || declaredMove.declarations.has(significantSquares[0].x === significantSquares[2].x ? MoveDeclarations.noCapture : MoveDeclarations.captureOnly)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.nonLeaping) && isBlocked(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCapture) && isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.captureOnly) && !isCapture(declaredMove.move, completedPos)) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.noCheck) && isInCheck(result, otherSide(data.whoseTurn))) &&
	                       !(declaredMove.declarations.has(MoveDeclarations.checkOnly) && !isInCheck(result, otherSide(data.whoseTurn)));
	switch (getTypeOfMove(declaredMove.move)) {
		case SpecialMoves.castle:
			current &&= data.whoseTurn === (declaredMove.move as CastleMove).side && Math.abs((declaredMove.move as CastleMove).direction) === 1 && data.castling[getCastleProperty(declaredMove.move as CastleMove)] && !(winByCheckmate && isInCheck(completedPos, data.whoseTurn));
			movedPiece.position.x += (declaredMove.move as CastleMove).direction;
			current &&= !(winByCheckmate && isInCheck(completedPos, data.whoseTurn));
			movedPiece.position.x -= (declaredMove.move as CastleMove).direction;
			break;
		case SpecialMoves.enpassant:
			current &&= data.enpassant && areCoordsEqual((declaredMove.move as Enpassant).captureSquare, {
				x: data.enpassant.x,
				y: data.enpassant.y + (data.whoseTurn === Sides.white ? 1 : -1) as PartialCoord,
			}) && Math.abs((declaredMove.move as Enpassant).captureSquare.x - movedPiece.position.x) === 1 && (declaredMove.move as Enpassant).captureSquare.y === movedPiece.position.y + (data.whoseTurn === Sides.white ? 1 : -1);
			break;
		case SpecialMoves.pawnDoubleMove:
			current &&= actualType(movedPiece) === Pieces.pawn && movedPiece.position.y === (data.whoseTurn === Sides.white ? 2 : 7);
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
			pieces: [...quantumPos.objects.entries()].map(([pieceIndex, objectSet]) => ({
				pieceType: structuredClone(objectSet.pieceType),
				position: discardProbability(objectSet.units[currentIndexes[pieceIndex]!]!.position),
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

export function checkPlayValidity(play: Play, quantumPos: ObjectPosition, settings: Settings = defaultSettings): Set<number> {
	assert(Number.isInteger(play.objectIndex) && 0 <= play.objectIndex && play.objectIndex < quantumPos.objects.length, "Invalid object index passed into 'isPlayLegal'");
	const problems: Set<number> = new Set;
	if (!play.primaryMoves.length) {
		problems.add(1);
	}
	if (quantumPos.objects[play.objectIndex]!.pieceType.side !== quantumPos.otherData.whoseTurn) {
		problems.add(2);
	}
	const unitPositions: Set<string> = new Set(quantumPos.objects[play.objectIndex]!.units.map(unit => JSON.stringify(discardPromotion(unit.position))));
	if ([...play.primaryMoves].some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add(3);
	}
	if ([...play.defaultMoves].some(declaredMove => !isMovePossible(declaredMove, quantumPos, settings.winByCheckmate) || !unitPositions.has(JSON.stringify(generateStartMiddleEnd(declaredMove.move)[0])))) {
		problems.add(4);
	}
	quantumPos.objects[play.objectIndex]!.units.entries().forEach(([unitIndex, unit]) => {
		const localPrimaries: DeclaredMove[] = play.primaryMoves.filter(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], unit.position));
		const localDefaults: DeclaredMove[] = play.defaultMoves.filter(declaredMove => areCoordsEqual(generateStartMiddleEnd(declaredMove.move)[0], unit.position));
		if (localDefaults.length > 1) {
			problems.add(5);
		}
		if (!settings.allowCastling && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.castle)) {
			problems.add(6);
		}
		if (!settings.castleSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.castle)) {
			problems.add(7);
		}
		if (!settings.pawnDoubleMoveSplitting && localPrimaries.length > 1 && [...localPrimaries, ...localDefaults].some(declaredMove => getTypeOfMove(declaredMove.move) === SpecialMoves.pawnDoubleMove)) {
			problems.add(8);
		}
		if (settings.winByCheckmate && generatePossiblePositions(quantumPos, play.objectIndex, unitIndex).some(completedPos => isInCheck(completedPos) && !(localDefaults[0] && isMoveLegal(localDefaults[0], completedPos, true)) && localPrimaries.some(declaredMove => !isMoveLegal(declaredMove, completedPos, true)))) {
			problems.add(9);
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
	const movedObject: ObjectSet = findObjectSet(quantumPos, significantSquares[0])!;
	const filledPos: CompletedPosition = objectsToFilledPosition(quantumPos);
	filledPos.pieces = filledPos.pieces.filter(completedPiece => areCoordsEqual(completedPiece.position, significantSquares[0]) || areOfDifferentObjects(quantumPos, completedPiece.position, significantSquares[0]));
	if (declaredMove.declarations.has("captureOnly") || declaredMove.declarations.has("noCapture") || isEndpointBlocked(declaredMove.move, filledPos)) {
		currentDependencies.push(significantSquares[2]);
	}
	if (declaredMove.declarations.has("nonLeaping")) {
		currentDependencies.push(...significantSquares[1].filter(coord => areOfDifferentObjects(quantumPos, coord, significantSquares[0])));
	}
	getResultOfMove(declaredMove.move, filledPos);
	function getCheckingDependencies(checkedCoords: Coord[], side: keyof typeof Sides): Coord[] {
		return checkedCoords.flatMap(checkedCoord => getLeapCheckingPieces(filledPos, side, checkedCoord).flatMap(checkingPiece => ((possiblePositions, predicate) => {
			possiblePositions.forEach(completedPos => {
				getResultOfMove(declaredMove.move, completedPos);
			});
			return possiblePositions.some(completedPos => predicate(completedPos)) && possiblePositions.some(completedPos => !predicate(completedPos));
		})(generatePossiblePositions(quantumPos, quantumPos.objects.indexOf(movedObject), movedObject.units.findIndex(unit => areCoordsEqual(unit.position, significantSquares[0]))), ((completedPos: CompletedPosition) => !!findPiece(completedPos, checkedCoord) && !!findPiece(completedPos, checkingPiece.position) && !isBlocked({
			start: checkingPiece.position,
			end: checkedCoord,
		}, completedPos))) ? (checkingPiece.pieceType.type_p === Pieces.knight ? [] : getBlockingPieces({
			start: checkingPiece.position,
			end: checkedCoord,
		}, filledPos).map(blockingPiece => discardPromotion(blockingPiece.position))).concat(checkedCoord, discardPromotion(checkingPiece.position)) : []));
	}
	if (winByCheckmate) {
		currentDependencies.push(...getCheckingDependencies(findObjectSetFromType(quantumPos, Pieces.king, quantumPos.otherData.whoseTurn)!.units.map(unit => discardPromotion(unit.position)), quantumPos.otherData.whoseTurn));
		if (getTypeOfMove(declaredMove.move) === SpecialMoves.castle) {
			currentDependencies.push(...getCheckingDependencies([significantSquares[0], significantSquares[1][0]!], quantumPos.otherData.whoseTurn));
		}
	}
	if (declaredMove.declarations.has("noCheck") || declaredMove.declarations.has("checkOnly")) {
		currentDependencies.push(...getCheckingDependencies(findObjectSetFromType(quantumPos, Pieces.king, otherSide(quantumPos.otherData.whoseTurn))!.units.map(unit => discardPromotion(unit.position)), otherSide(quantumPos.otherData.whoseTurn)));
	}
	return currentDependencies.filter(dependency => areOfDifferentObjects(quantumPos, significantSquares[0], dependency));
}

export function cleanEntanglements(units: PositionedPiece[], makeCopy: boolean = false): PositionedPiece[] {
	const newUnits: PositionedPiece[] = makeCopy ? Fraction.fractionalClone(units) : units;
	const unitPositions: Set<string> = new Set(units.map(unit => JSON.stringify(discardPromotion(unit.position))));
	newUnits.forEach(unit => {
		unit.entangledTo = unit.entangledTo.filter(entangledCoord => unitPositions.has(JSON.stringify(entangledCoord)));
	});
	return newUnits;
}

/*export function generateMeasurementResults(quantumPos: ObjectPosition, objectSet: ObjectSet, dependencies: Coord[], measurementType: boolean = defaultSettings.measurementType, coefficient: Fraction = new Fraction): [ObjectPosition, Fraction, boolean][] {
	assert(quantumPos.objects.includes(objectSet), "Invalid object reference passed into 'generateMeasurementResults'");
	const objectIndex: number = quantumPos.objects.indexOf(objectSet);
	const excludedUnitArray: PositionedPiece[] = objectSet.units.filter(unit => falseCoords.some(falseCoord => areCoordsEqual(falseCoord, unit.position)) || !!trueCoords.length && !trueCoords.some(trueCoord => areCoordsEqual(trueCoord, unit.position)));
	const excludedUnitSet: Set<PositionedPiece> = new Set(excludedUnitArray);
	const measurementSet: Set<PositionedPiece> = new Set(excludedUnitArray.flatMap(unit => [unit, ...unit.entangledTo.map(entangledCoord => findUnit(quantumPos, entangledCoord)!)]));
	const measurementArray: PositionedPiece[] = [...measurementSet];
	const totalProbability: Fraction = Fraction.sum(...objectSet.units.map(unit => unit.position.probability));
	const innerProbability: Fraction = Fraction.sum(...measurementArray.map(unit => unit.position.probability));
	if (measurementType) {
		const copiedPosQ: ObjectPosition = Fraction.fractionalClone(quantumPos);
		let selectedUnits: PositionedPiece[] = copiedPosQ.objects[objectIndex]!.units;
		selectedUnits = cleanEntanglements(selectedUnits.filter(unit => !measurementSet.has(unit)));
		if (!selectedUnits.length) {
			copiedPosQ.objects.splice(objectIndex, 1);
		}
		for (const unit of selectedUnits) {
			unit.position.probability.divide((new Fraction).subtract(innerProbability));
		}
		return [...measurementArray.map(unit => {
			const copiedPos: ObjectPosition = Fraction.fractionalClone(quantumPos);
			copiedPos.objects[objectIndex]!.units = [{
				position: addProbability(discardProbability(unit.position)),
				entangledTo: [],
			}];
			return [copiedPos, Fraction.product(coefficient, unit.position.probability), !excludedUnitSet.has(unit)];
		}), ...(innerProbability.lessThan(new Fraction) ? [[copiedPosQ, Fraction.product(coefficient, (new Fraction).subtract(innerProbability)), true]] : [])] as [ObjectPosition, Fraction, boolean][];
	} else {
		return [...objectSet.units.filter(unit => measurementSet.has(unit) && !excludedUnitSet.has(unit)).keys().map(unitIndex => {
			const copiedPos: ObjectPosition = Fraction.fractionalClone(quantumPos);
			let selectedUnits: PositionedPiece[] = copiedPos.objects[objectIndex]!.units;
			selectedUnits[unitIndex]!.position.probability = Fraction.fractionalClone(innerProbability);
			selectedUnits = cleanEntanglements(selectedUnits.filter(unit => !excludedUnitSet.has(unit)));

		})];
	}
}

export function generatePlayResults(play: Play, quantumPos: ObjectPosition, settings: Settings = defaultSettings, coefficient: Fraction = new Fraction): [ObjectPosition, Fraction][] {
	if (!play.primaryMoves.length) {
		return [[quantumPos, coefficient]];
	}
	
}*/
