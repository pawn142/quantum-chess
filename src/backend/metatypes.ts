import Fraction from "./arithmetic.js";
import assert from "../assert.js";

import { addProbability, allDeclarations, areCoordsEqual, chessboard, defaultData, discardProbability, enpassantDisplacement, getSide, isCoord, translateCoord, validPromotions, ChessboardPosition, Coord, GameData, MoveDeclarations, PositionedPiece, ObjectPosition, PartialCoord, Pieces, Sides, WeightedCoord } from "./piecetypes.js";

export function filteredEntries(obj: object): [string, any][] {
	return Object.entries(obj).filter((entry: [string, any]) => entry[1] !== undefined);
}

export const boardFiles: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function coordserialize(coord: Coord): string {
	return boardFiles[coord.x - 1] + coord.y.toString();
}

export class Entanglement {
	fromIndex: number;
	toIndex: number;

	constructor(fromCandidate: number, toCandidate: number, rangeList: any[] = chessboard) {
		assert(new Set([fromCandidate, toCandidate]).isSubsetOf(new Set(rangeList.keys())), "Tried to initialize PieceEntanglement with an invalid from index or to index");
		this.fromIndex = fromCandidate;
		this.toIndex = toCandidate;
	}

	static entangledClone<T>(obj: T): T {
		if (obj instanceof Fraction) {
			return new Fraction(obj.numerator, obj.denominator) as T;
		} else if (obj instanceof Entanglement) {
			return new Entanglement(obj.fromIndex, obj.toIndex) as T;
		} else if (Array.isArray(obj)) {
			return obj.map(element => Entanglement.entangledClone(element)) as T;
		} else if (typeof obj === "object" && obj !== null) {
			return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, Entanglement.entangledClone(value)])) as T;
		} else {
			return obj;
		}
	}
}

export interface PieceSet {
	states: WeightedCoord[];
	entanglements: Entanglement[];
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
	n1?: PieceSet;
	b1?: PieceSet;
	q1?: PieceSet;
	k1?: PieceSet;
	b2?: PieceSet;
	n2?: PieceSet;
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
	q1?: Coord;
	k1?: Coord;
	b2?: Coord;
	n2?: Coord;
	r2?: Coord;
}

export interface GamePosition {
	whitePosition: HalfPosition;
	blackPosition: HalfPosition;
	otherData: GameData;
}

export interface CompletedGamePosition {
	whitePosition: CompletedHalfPosition;
	blackPosition: CompletedHalfPosition;
	otherData?: GameData;
}

export const defaultGamePosition: CompletedGamePosition = {
	whitePosition: {
		p1: { x: 1, y: 2 },
		p2: { x: 2, y: 2 },
		p3: { x: 3, y: 2 },
		p4: { x: 4, y: 2 },
		p5: { x: 5, y: 2 },
		p6: { x: 6, y: 2 },
		p7: { x: 7, y: 2 },
		p8: { x: 8, y: 2 },
		r1: { x: 1, y: 1 },
		n1: { x: 2, y: 1 },
		b1: { x: 3, y: 1 },
		q1: { x: 4, y: 1 },
		k1: { x: 5, y: 1 },
		b2: { x: 6, y: 1 },
		n2: { x: 7, y: 1 },
		r2: { x: 8, y: 1 },
	},
	blackPosition: {
		p1: { x: 1, y: 7 },
		p2: { x: 2, y: 7 },
		p3: { x: 3, y: 7 },
		p4: { x: 4, y: 7 },
		p5: { x: 5, y: 7 },
		p6: { x: 6, y: 7 },
		p7: { x: 7, y: 7 },
		p8: { x: 8, y: 7 },
		r1: { x: 1, y: 8 },
		n1: { x: 2, y: 8 },
		b1: { x: 3, y: 8 },
		q1: { x: 4, y: 8 },
		k1: { x: 5, y: 8 },
		b2: { x: 6, y: 8 },
		n2: { x: 7, y: 8 },
		r2: { x: 8, y: 8 },
	},
	otherData: structuredClone(defaultData),
} as const;

export function completedPositionToGamePosition(completedPosition: CompletedGamePosition): GamePosition {
	return {
		whitePosition: Object.fromEntries(filteredEntries(completedPosition.whitePosition).map(([pieceKey, pieceCoord]: [string, Coord]) => [pieceKey, {
			states: [addProbability(pieceCoord)],
			entanglements: [],
		}])),
		blackPosition: Object.fromEntries(filteredEntries(completedPosition.blackPosition).map(([pieceKey, pieceCoord]: [string, Coord]) => [pieceKey, {
			states: [addProbability(pieceCoord)],
			entanglements: [],
		}])),
		otherData: structuredClone(completedPosition.otherData ?? defaultData),
	};
}

export function getDataString(gameData: GameData): string {
	return `turn: ${gameData.whoseTurn}, castling: wl ${gameData.castling.canWhiteCastleLeft.toString()} wr ${gameData.castling.canWhiteCastleRight.toString()} bl ${gameData.castling.canBlackCastleLeft.toString()} br ${gameData.castling.canBlackCastleRight.toString()}, enpassant: ${gameData.enpassant ? coordserialize(gameData.enpassant) : "false"}, qubits: w ${gameData.qubits.whiteBalance} b ${gameData.qubits.blackBalance}`;
}

export function getPositionString(gamePosition: GamePosition): string {
	let positionString: string = getDataString(gamePosition.otherData);
	filteredEntries(gamePosition.whitePosition).forEach(([whiteKey, whitePiece]: [string, PieceSet]) => {
		let whiteString: string = "";
		whitePiece.states.forEach(coord => whiteString += ` (${coordserialize(coord)},${coord.probability.serialize() + (coord.promotion ? "," + coord.promotion : "")}),`);
		whitePiece.entanglements.forEach(entanglement => whiteString += ` <${entanglement.fromIndex}-${entanglement.toIndex}>,`);
		positionString += `|${whiteKey[0]!.toUpperCase() + whiteKey.slice(1)}:${whiteString.slice(0, -1)}`;
	});
	filteredEntries(gamePosition.blackPosition).forEach(([blackKey, blackPiece]: [string, PieceSet]) => {
		let blackString: string = "";
		blackPiece.states.forEach(coord => blackString += ` (${coordserialize(coord)},${coord.probability.serialize() + (coord.promotion ? "," + coord.promotion : "")}),`);
		blackPiece.entanglements.forEach(entanglement => blackString += ` <${entanglement.fromIndex}-${entanglement.toIndex}>,`);
		positionString += `|${blackKey}:${blackString.slice(0, -1)}`;
	});
	return positionString;
}

export function getDataFromString(dataString: string): GameData {
	const splitData: string[] = dataString.split(" ");
	return {
		whoseTurn: Sides[splitData[1]!.slice(0, -1) as keyof typeof Sides],
		castling: {
			canWhiteCastleLeft: JSON.parse(splitData[4]!),
			canWhiteCastleRight: JSON.parse(splitData[6]!),
			canBlackCastleLeft: JSON.parse(splitData[8]!),
			canBlackCastleRight: JSON.parse(splitData[10]!.slice(0, -1)),
		},
		enpassant: splitData[12] === "false," ? false : {
			x: boardFiles.indexOf(splitData[12]![0]!) + 1 as PartialCoord,
			y: parseInt(splitData[12]![1]!) as PartialCoord,
		},
		qubits: {
			whiteBalance: parseFloat(splitData[15]!),
			blackBalance: parseFloat(splitData[17]!),
		}
	};
}

export function decodeSegment(segment: string): WeightedCoord {
	return {
		x: boardFiles.indexOf(segment[1]!) + 1 as PartialCoord,
		y: parseInt(segment[2]!) as PartialCoord,
		promotion: Pieces[segment.split(",")[2]?.slice(0, -1) as keyof typeof Pieces],
		probability: new Fraction(parseInt(segment.split(",")[1]!.split("/")[0]!), parseInt(segment.split(",")[1]!.split("/")[1]!)),
	};
}

export function getPositionFromString(positionString: string): GamePosition {
	const components: string[] = positionString.split("|");
	const whitePositionArray: [string, PieceSet][] = [];
	const blackPositionArray: [string, PieceSet][] = [];
	for (const pieceString of components.slice(1)) {
		const pieceStates: WeightedCoord[] = [];
		const entanglements: Entanglement[] = [];
		for (const segment of pieceString.split(" ").slice(1)) {
			if (segment[0] === "(") {
				pieceStates.push(decodeSegment(segment));
			} else {
				entanglements.push(new Entanglement(parseInt(segment.split("-")[0]!.slice(1)), parseInt(segment.split("-")[1]!), pieceStates));
			}
		}
		(pieceString[0] === pieceString[0]!.toLowerCase() ? blackPositionArray : whitePositionArray).push([pieceString.slice(0, 2).toLowerCase(), {
			states: pieceStates,
			entanglements: entanglements,
		}]);
	}
	return {
		whitePosition: Object.fromEntries(whitePositionArray),
		blackPosition: Object.fromEntries(blackPositionArray),
		otherData: getDataFromString(components[0]!),
	};
}

export function keyToPiece(key: string): keyof typeof Pieces {
	switch (key[0]) {
		case "p":
			return Pieces.pawn;
		case "n":
			return Pieces.knight;
		case "b":
			return Pieces.bishop;
		case "r":
			return Pieces.rook;
		case "q":
			return Pieces.queen;
		case "k":
			return Pieces.king;
		default:
			throw new Error("Unidentified key passed into 'keyToPiece'");
	}
}

export function gamePositionToObjects(gamePosition: GamePosition): ObjectPosition {
	function pieceSetToPieces(pieceSet: PieceSet): PositionedPiece[] {
		return pieceSet.states.map(pieceCoord => ({
			state: Fraction.fractionalClone(pieceCoord),
			entangledTo: pieceSet.entanglements.filter(entanglement => pieceSet.states[entanglement.fromIndex] === pieceCoord).map(entanglement => discardProbability(pieceSet.states[entanglement.toIndex]!)),
		}));
	}
	return {
		objects: [
			...filteredEntries(gamePosition.whitePosition).map(([whitePieceKey, whitePiece]: [string, PieceSet]) => ({
				pieceType: {
					type_p: keyToPiece(whitePieceKey),
					side: Sides.white,
				},
				units: pieceSetToPieces(whitePiece),
			})),
			...filteredEntries(gamePosition.blackPosition).map(([blackPieceKey, blackPiece]: [string, PieceSet]) => ({
				pieceType: {
					type_p: keyToPiece(blackPieceKey),
					side: Sides.black,
				},
				units: pieceSetToPieces(blackPiece),
			})),
		],
		otherData: structuredClone(gamePosition.otherData),
	};
}

export function objectsToGamePosition(objectPosition: ObjectPosition): GamePosition {
	function piecesToPieceSet(pieces: PositionedPiece[] | undefined): PieceSet | undefined {
		if (!pieces) {
			return undefined;
		}
		return {
			states: pieces.map(piece => Fraction.fractionalClone(piece.state)),
			entanglements: pieces.flatMap(piece => piece.entangledTo.map(pieceCoord => new Entanglement(pieces.indexOf(piece), pieces.findIndex(candidate => areCoordsEqual(candidate.state, pieceCoord)), pieces))),
		};
	}
	return {
		whitePosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(getSide(objectPosition, Sides.white).filter(objectSet => objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.units),
		])),
		blackPosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(getSide(objectPosition, Sides.black).filter(objectSet => objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.units),
		])),
		otherData: structuredClone(objectPosition.otherData),
	};
}

export function getCastleValues(gamePosition: GamePosition): [boolean, boolean, boolean, boolean] {
	return [
		JSON.stringify(gamePosition.whitePosition.k1?.states[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r1?.states[0]) === '{"x":1,"y":1,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.whitePosition.k1?.states[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r2?.states[0]) === '{"x":8,"y":1,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.blackPosition.k1?.states[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r1?.states[0]) === '{"x":1,"y":8,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.blackPosition.k1?.states[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r2?.states[0]) === '{"x":8,"y":8,"probability":{"numerator":1,"denominator":1}}',
	];
}

export function validStartingPositionCheck(gamePosition: GamePosition): boolean {
	try {
		new ChessboardPosition(gamePositionToObjects(gamePosition).objects);
	} catch {
		return false;
	}
	const properKeys: string[] = ["", ...Object.keys(defaultGamePosition.whitePosition)] as const;
	const candidateKeys: string[] = ["", ...Object.keys(gamePosition.whitePosition), "", ...Object.keys(gamePosition.blackPosition)] as const;
	return [gamePosition.otherData.qubits.whiteBalance, gamePosition.otherData.qubits.blackBalance].every(amount => amount >= 0) &&
	       candidateKeys.every((key, keyIndex) => !key || properKeys.indexOf(key) > properKeys.indexOf(candidateKeys[keyIndex - 1]!)) &&
	       candidateKeys.indexOf("k1") !== candidateKeys.lastIndexOf("k1") &&
	       [...filteredEntries(gamePosition.whitePosition), ...filteredEntries(gamePosition.blackPosition)].every((pieceEntry: [string, PieceSet]) => pieceEntry[1].states.reduce((accumulator, current) => ({
		       x: 1,
		       y: 1,
		       probability: Fraction.sum(accumulator.probability, current.probability),
	       })).probability.lessThanOrEqualTo(new Fraction) && pieceEntry[1].states.every(pieceCoord => pieceCoord.probability.numerator > 0 && pieceCoord.probability.denominator > 0) && (pieceEntry[0][0] !== "p" || pieceEntry[1].states.every(pieceCoord => (![1, 8].includes(pieceCoord.y) || pieceCoord.promotion) && validPromotions.has(pieceCoord.promotion))) && (pieceEntry[0][0] === "p" || pieceEntry[1].states.every(pieceCoord => pieceCoord.promotion === undefined))) &&
	       (!gamePosition.otherData.enpassant || isCoord(gamePosition.otherData.enpassant) && [3, 6].includes(gamePosition.otherData.enpassant.y) && (gamePosition.otherData.whoseTurn === Sides.white ? filteredEntries(gamePosition.blackPosition) : filteredEntries(gamePosition.whitePosition)).some((pieceEntry: [string, PieceSet]) => pieceEntry[0][0] === "p" && pieceEntry[1].states.some(pieceCoord => !pieceCoord.promotion && areCoordsEqual(translateCoord(pieceCoord, 0, enpassantDisplacement(gamePosition.otherData.whoseTurn), true), gamePosition.otherData.enpassant as Coord)))) &&
	       (!gamePosition.otherData.castling.canWhiteCastleLeft  || getCastleValues(gamePosition)[0]) &&
	       (!gamePosition.otherData.castling.canWhiteCastleRight || getCastleValues(gamePosition)[1]) &&
	       (!gamePosition.otherData.castling.canBlackCastleLeft  || getCastleValues(gamePosition)[2]) &&
	       (!gamePosition.otherData.castling.canBlackCastleRight || getCastleValues(gamePosition)[3]);
}

export function isValidPositionString(candidateString: string): boolean {
	try {
		return validStartingPositionCheck(getPositionFromString(candidateString)) && getPositionString(getPositionFromString(candidateString)) === candidateString;
	} catch {
		return false;
	}
}

export function isValidStartingPosition(candidatePosition: GamePosition): boolean {
	try {
		return isValidPositionString(getPositionString(candidatePosition));
	} catch {
		return false;
	}
}

export interface GameSettings {
	winByCheckmate: boolean;
	nullPlays: boolean;
	allowCastling: boolean;
	castleSplitting: boolean;
	pawnDoubleMoveSplitting: boolean;
	measurePieceCaptures: boolean;
	measureKingCaptures: boolean;
	partialQubitRewards: boolean;
	advancedQubitMode: boolean;
	unlimitedQubits: boolean;
	allowedMoveDeclarations: {
		captureOnly: boolean;
		noCapture: boolean;
		checkOnly: boolean;
		noCheck: boolean;
		nonLeaping: boolean;
	},
	measurementType: boolean;
}

export const defaultSettings: GameSettings = {
	winByCheckmate: false,
	nullPlays: false,
	allowCastling: true,
	castleSplitting: false,
	pawnDoubleMoveSplitting: false,
	measurePieceCaptures: false,
	measureKingCaptures: true,
	partialQubitRewards: false,
	advancedQubitMode: false,
	unlimitedQubits: false,
	allowedMoveDeclarations: {
		captureOnly: false,
		noCapture: false,
		checkOnly: false,
		noCheck: false,
		nonLeaping: false,
	},
	measurementType: true,
} as const;

export function allowedDeclarations(settings: GameSettings = defaultSettings): Set<keyof typeof MoveDeclarations> {
	return new Set([...allDeclarations].filter(declaration => settings.allowedMoveDeclarations[declaration]));
}

export function measurePartiallyCaptured(rawType: keyof typeof Pieces, settings: GameSettings = defaultSettings): boolean {
	return rawType === Pieces.king ? settings.measureKingCaptures : settings.measurePieceCaptures;
}
