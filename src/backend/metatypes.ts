import Fraction from "./arithmetic.js";
import assert from "assert";
import { addProbability, areCoordsEqual, chessboard, defaultData, discardProbability, isCoord, validPromotions, ChessboardPosition, Coord, GameData, PositionedPiece, ObjectPosition, PartialCoord, Pieces, Sides, WeightedCoord } from "./piecetypes.js";

export function filteredEntries(obj: object): [string, any][] {
	return Object.entries(obj).filter((entry: [string, any]) => entry[1] !== undefined && entry[1] !== null);
}

export const boardFiles: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function coordserialize(coord: Coord): string {
	return boardFiles[coord.x - 1] + coord.y.toString();
}

export class PieceEntanglement {
	fromIndex: number;
	toIndex: number;
	constructor(fromCandidate: number, toCandidate: number, rangeList: any[] = chessboard) {
		assert(Number.isInteger(fromCandidate) && Number.isInteger(toCandidate), "Tried to initialize PieceEntanglement with a non-integer from index or to index");
		assert(0 <= fromCandidate && fromCandidate < rangeList.length && 0 <= toCandidate && toCandidate < rangeList.length, "Tried to initialize PieceEntanglement with a from index or to index that is out of bounds");
		this.fromIndex = fromCandidate;
		this.toIndex = toCandidate;
	}
}

export interface PieceSet {
	positions: WeightedCoord[];
	entanglements: PieceEntanglement[];
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
	otherData: defaultData,
} as const;

export function completedPositionToGamePosition(completedPosition: CompletedGamePosition): GamePosition {
	return {
		whitePosition: Object.fromEntries(filteredEntries(completedPosition.whitePosition).map(([pieceKey, pieceCoord]: [string, Coord]) => [pieceKey, {
			positions: [addProbability(pieceCoord)],
			entanglements: [],
		}])),
		blackPosition: Object.fromEntries(filteredEntries(completedPosition.blackPosition).map(([pieceKey, pieceCoord]: [string, Coord]) => [pieceKey, {
			positions: [addProbability(pieceCoord)],
			entanglements: [],
		}])),
		otherData: structuredClone(completedPosition.otherData ?? defaultData),
	};
}

export function getPositionString(gamePosition: GamePosition): string {
	let positionString: string = `turn: ${gamePosition.otherData.whoseTurn}, castling: wl ${gamePosition.otherData.castling.canWhiteCastleLeft.toString()} wr ${gamePosition.otherData.castling.canWhiteCastleRight.toString()} bl ${gamePosition.otherData.castling.canBlackCastleLeft.toString()} br ${gamePosition.otherData.castling.canBlackCastleRight.toString()}, enpassant: ${gamePosition.otherData.enpassant ? coordserialize(gamePosition.otherData.enpassant) : "false"}`;
	filteredEntries(gamePosition.whitePosition).forEach(([whiteKey, whitePiece]: [string, PieceSet]) => {
		let whiteString: string = "";
		whitePiece.positions.forEach(coord => {
			whiteString += ` (${coordserialize(coord)},${coord.probability.serialize() + (coord.promotion ? "," + coord.promotion : "")}),`;
		});
		whitePiece.entanglements.forEach(entanglement => {
			whiteString += ` <${entanglement.fromIndex}-${entanglement.toIndex}>,`;
		});
		positionString += `|${whiteKey[0]!.toUpperCase() + whiteKey.slice(1)}:${whiteString.slice(0, -1)}`;
	});
	filteredEntries(gamePosition.blackPosition).forEach(([blackKey, blackPiece]: [string, PieceSet]) => {
		let blackString: string = "";
		blackPiece.positions.forEach(coord => {
			blackString += ` (${coordserialize(coord)},${coord.probability.serialize() + (coord.promotion ? "," + coord.promotion : "")}),`;
		});
		blackPiece.entanglements.forEach(entanglement => {
			blackString += ` <${entanglement.fromIndex}-${entanglement.toIndex}>,`;
		});
		positionString += `|${blackKey}:${blackString.slice(0, -1)}`;
	});
	return positionString;
}

export function getPositionFromString(positionString: string): GamePosition {
	const components: string[] = positionString.split("|");
	const metadata: string[] = components[0]!.split(" ");
	const whitePositionArray: [string, PieceSet][] = [];
	const blackPositionArray: [string, PieceSet][] = [];
	for (const pieceString of components.slice(1)) {
		const positionArray: WeightedCoord[] = [];
		const entanglementArray: PieceEntanglement[] = [];
		for (const segment of pieceString.split(" ").slice(1)) {
			if (segment[0] === "(") {
				positionArray.push({
					x: boardFiles.indexOf(segment[1]!) + 1 as PartialCoord,
					y: parseInt(segment[2]!) as PartialCoord,
					promotion: Pieces[segment.split(",")[2]?.slice(0, -1) as keyof typeof Pieces],
					probability: new Fraction(parseInt(segment.split(",")[1]!.split("/")[0]!), parseInt(segment.split(",")[1]!.split("/")[1]!)),
				});
			} else {
				entanglementArray.push(new PieceEntanglement(parseInt(segment.split("-")[0]!.slice(1)), parseInt(segment.split("-")[1]!.slice(0, -1)), positionArray));
			}
		}
		(pieceString[0] === pieceString[0]!.toLowerCase() ? blackPositionArray : whitePositionArray).push([pieceString.slice(0, 2).toLowerCase(), {
			positions: positionArray,
			entanglements: entanglementArray,
		}]);
	}
	return {
		whitePosition: Object.fromEntries(whitePositionArray),
		blackPosition: Object.fromEntries(blackPositionArray),
		otherData: {
			whoseTurn: Sides[metadata[1]!.slice(0, -1) as keyof typeof Sides],
			castling: {
				canWhiteCastleLeft: JSON.parse(metadata[4]!),
				canWhiteCastleRight: JSON.parse(metadata[6]!),
				canBlackCastleLeft: JSON.parse(metadata[8]!),
				canBlackCastleRight: JSON.parse(metadata[10]!.slice(0, -1)),
			},
			enpassant: metadata[12] === "false" ? false : {
				x: boardFiles.indexOf(metadata[12]![0]!) + 1 as PartialCoord,
				y: parseInt(metadata[12]![1]!) as PartialCoord,
			},
		},
	};
}

function keyToPiece(key: string): keyof typeof Pieces {
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
		return pieceSet.positions.map(pieceCoord => ({
			position: Fraction.fractionalClone(pieceCoord),
			entangledTo: pieceSet.entanglements.filter(entanglement => pieceSet.positions[entanglement.fromIndex] === pieceCoord).map(entanglement => discardProbability(pieceSet.positions[entanglement.toIndex]!)),
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
			positions: pieces.map(piece => Fraction.fractionalClone(piece.position)),
			entanglements: pieces.flatMap(piece => piece.entangledTo.map(pieceCoord => new PieceEntanglement(pieces.indexOf(piece), pieces.findIndex(candidate => areCoordsEqual(candidate.position, pieceCoord)), pieces))),
		};
	}
	return {
		whitePosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(objectPosition.objects.filter(objectSet => objectSet.pieceType.side === Sides.white && objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.units),
		])),
		blackPosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(objectPosition.objects.filter(objectSet => objectSet.pieceType.side === Sides.black && objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.units),
		])),
		otherData: structuredClone(objectPosition.otherData),
	};
}

export function getCastleValues(gamePosition: GamePosition): [boolean, boolean, boolean, boolean] {
	return [
		JSON.stringify(gamePosition.whitePosition.k1?.positions[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r1?.positions[0]) === '{"x":1,"y":1,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.whitePosition.k1?.positions[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r2?.positions[0]) === '{"x":8,"y":1,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.blackPosition.k1?.positions[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r1?.positions[0]) === '{"x":1,"y":8,"probability":{"numerator":1,"denominator":1}}',
		JSON.stringify(gamePosition.blackPosition.k1?.positions[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r2?.positions[0]) === '{"x":8,"y":8,"probability":{"numerator":1,"denominator":1}}',
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
	return [...Array(candidateKeys.length).keys()].every(pieceIndex => !candidateKeys[pieceIndex] || properKeys.indexOf(candidateKeys[pieceIndex]) > properKeys.indexOf(candidateKeys[pieceIndex - 1]!)) &&
	       candidateKeys.indexOf("k1") !== candidateKeys.lastIndexOf("k1") &&
	       [...filteredEntries(gamePosition.whitePosition), ...filteredEntries(gamePosition.blackPosition)].every((pieceEntry: [string, PieceSet]) => pieceEntry[1].positions.reduce((accumulator, current) => ({
		       x: 1,
		       y: 1,
		       probability: Fraction.sum(accumulator.probability, current.probability),
	       })).probability.lessThanOrEqualTo(new Fraction) && pieceEntry[1].positions.every(pieceCoord => new Fraction(0).lessThan(pieceCoord.probability)) && (pieceEntry[0][0] !== "p" || pieceEntry[1].positions.every(pieceCoord => (![1, 8].includes(pieceCoord.y) || pieceCoord.promotion) && validPromotions.has(pieceCoord.promotion))) && (pieceEntry[0][0] === "p" || pieceEntry[1].positions.every(pieceCoord => !pieceCoord.promotion))) &&
	       (!gamePosition.otherData.enpassant || isCoord(gamePosition.otherData.enpassant) && [4, 5].includes(gamePosition.otherData.enpassant.y) && (gamePosition.otherData.whoseTurn === Sides.white ? filteredEntries(gamePosition.blackPosition) : filteredEntries(gamePosition.whitePosition)).some((pieceEntry: [string, PieceSet]) => pieceEntry[0][0] === "p" && pieceEntry[1].positions.some(pieceCoord => !pieceCoord.promotion && areCoordsEqual(pieceCoord, gamePosition.otherData.enpassant as Coord)))) &&
	       (!gamePosition.otherData.castling.canWhiteCastleLeft  || getCastleValues(gamePosition)[0]) &&
	       (!gamePosition.otherData.castling.canWhiteCastleRight || getCastleValues(gamePosition)[1]) &&
	       (!gamePosition.otherData.castling.canBlackCastleLeft  || getCastleValues(gamePosition)[2]) &&
	       (!gamePosition.otherData.castling.canBlackCastleRight || getCastleValues(gamePosition)[3]);
}

export function isValidPositionString(stringCandidate: string): boolean {
	try {
		return validStartingPositionCheck(getPositionFromString(stringCandidate)) && getPositionString(getPositionFromString(stringCandidate)) === stringCandidate;
	} catch {
		return false;
	}
}

export function isValidStartingPosition(positionCandidate: GamePosition): boolean {
	try {
		return isValidPositionString(getPositionString(positionCandidate));
	} catch {
		return false;
	}
}

export interface Settings {
	winByCheckmate: boolean;
	allowCastling: boolean;
	castleSplitting: boolean;
	pawnDoubleMoveSplitting: boolean;
	measurePieceCaptures: boolean;
	measureKingCaptures: boolean;
	partialQubitRewards: boolean;
	advancedQubitMode: boolean;
	allowedMoveDeclarations: {
		captureOnly: boolean;
		checkOnly: boolean;
		noCapture: boolean;
		noCheck: boolean;
		nonLeaping: boolean;
	},
	measurementType: boolean;
}

export const defaultSettings: Settings = {
	winByCheckmate: false,
	allowCastling: true,
	castleSplitting: false,
	pawnDoubleMoveSplitting: false,
	measurePieceCaptures: false,
	measureKingCaptures: true,
	partialQubitRewards: false,
	advancedQubitMode: false,
	allowedMoveDeclarations: {
		captureOnly: false,
		checkOnly: false,
		noCapture: false,
		noCheck: false,
		nonLeaping: false,
	},
	measurementType: true,
} as const;
