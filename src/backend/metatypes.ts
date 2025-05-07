import Fraction from './arithmetic.js';
import assert from 'assert';
import { addProbability, areCoordsEqual, chessboard, defaultPosition, discardProbability, ChessboardPosition, Coord, GameData, PositionedPiece, ObjectPosition, PartialCoord, Pieces, Sides, WeightedCoord } from './piecetypes.js';

export function filteredEntries(obj: object): [string, any][] {
	return Object.entries(obj).filter((entry: [string, any]) => entry[1] !== undefined && entry[1] !== null);
}

export const boardFiles: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function coordserialize(coordinate: Coord): string {
	return boardFiles[coordinate.x - 1] + coordinate.y.toString();
}

export class PieceEntanglement {
	from: number;
	to: number;
	constructor(fromCandidate: number, toCandidate: number, positionList: Coord[] | WeightedCoord[] = chessboard) {
		assert(Number.isInteger(fromCandidate) && Number.isInteger(toCandidate), "Tried to initialize PieceEntanglement with a non-integer from index or to index");
		assert(0 <= fromCandidate && fromCandidate < positionList.length && 0 <= toCandidate && toCandidate < positionList.length, "Tried to initialize PieceEntanglement with a from index or to index that is out of bounds");
		this.from = fromCandidate;
		this.to = toCandidate;
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
	otherData: defaultPosition.otherData,
} as const;

export function completedPositionToPosition(completedPosition: CompletedGamePosition): GamePosition {
	return {
		whitePosition: Object.fromEntries(filteredEntries(completedPosition.whitePosition).map(([whiteCoordKey, whiteCoord]: [string, Coord]) => [
			whiteCoordKey,
			{
				positions: [addProbability(whiteCoord)],
				entanglements: [],
			},
		])),
		blackPosition: Object.fromEntries(filteredEntries(completedPosition.blackPosition).map(([blackCoordKey, blackCoord]: [string, Coord]) => [
			blackCoordKey,
			{
				positions: [addProbability(blackCoord)],
				entanglements: [],
			},
		])),
		otherData: structuredClone(completedPosition.otherData ?? defaultGamePosition.otherData)!,
	};
}

export function getPositionString(gamePosition: GamePosition): string {
	let positionString: string = `turn: ${gamePosition.otherData.whoseTurn}, castling: wl ${gamePosition.otherData.castling.canWhiteCastleLeft.toString()} wr ${gamePosition.otherData.castling.canWhiteCastleRight.toString()} bl ${gamePosition.otherData.castling.canBlackCastleLeft.toString()} br ${gamePosition.otherData.castling.canBlackCastleRight.toString()}, enpassant: ${gamePosition.otherData.enpassant ? coordserialize(gamePosition.otherData.enpassant) : "false"}`;
	filteredEntries(gamePosition.whitePosition).forEach(([whiteKey, whitePiece]: [string, PieceSet]) => {
		let whiteString: string = "";
		for (const whiteCoord of whitePiece.positions) {
			whiteString += ` (${coordserialize(whiteCoord)},${whiteCoord.probability.serialize() + (whiteCoord.promotion ? "," + whiteCoord.promotion : "")}),`;
		}
		for (const whiteEntanglement of whitePiece.entanglements) {
			whiteString += ` <${whiteEntanglement.from}-${whiteEntanglement.to}>,`;
		}
		positionString += `|${whiteKey[0]!.toUpperCase() + whiteKey.slice(1)}:${whiteString.slice(0, -1)}`;
	});
	filteredEntries(gamePosition.blackPosition).forEach(([blackKey, blackPiece]: [string, PieceSet]) => {
		let blackString: string = "";
		for (const blackCoord of blackPiece.positions) {
			blackString += ` (${coordserialize(blackCoord)},${blackCoord.probability.serialize() + (blackCoord.promotion ? "," + blackCoord.promotion : "")}),`;
		}
		for (const blackEntanglement of blackPiece.entanglements) {
			blackString += ` <${blackEntanglement.from}-${blackEntanglement.to}>,`;
		}
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
			throw new Error("Unidentified key in use of 'keyToPiece'");
	}
}

export function positionToObjects(gamePosition: GamePosition): ObjectPosition {
	function pieceSetToPieces(pieceSet: PieceSet): PositionedPiece[] {
		return pieceSet.positions.map(pieceCoord => ({
			position: Fraction.fractionalClone(pieceCoord),
			entangledTo: pieceSet.entanglements.filter(entanglement => pieceSet.positions[entanglement.from] === pieceCoord).map(entanglement => discardProbability(pieceSet.positions[entanglement.to]!)),
		}));
	}
	return {
		objects: [
			...filteredEntries(gamePosition.whitePosition).map(([whiteKey, whitePiece]: [string, PieceSet]) => ({
				pieceType: {
					type_p: keyToPiece(whiteKey),
					side: Sides.white,
				},
				partialPieces: pieceSetToPieces(whitePiece),
			})),
			...filteredEntries(gamePosition.blackPosition).map(([blackKey, blackPiece]: [string, PieceSet]) => ({
				pieceType: {
					type_p: keyToPiece(blackKey),
					side: Sides.black,
				},
				partialPieces: pieceSetToPieces(blackPiece),
			})),
		],
		otherData: structuredClone(gamePosition.otherData),
	};
}

export function objectsToPosition(objectPosition: ObjectPosition): GamePosition {
	function piecesToPieceSet(pieces?: PositionedPiece[]): PieceSet | undefined {
		if (!pieces) {
			return undefined;
		}
		const coordinates: WeightedCoord[] = pieces.map(piece => piece.position);
		return {
			positions: pieces.map(piece => Fraction.fractionalClone(piece.position)),
			entanglements: pieces.flatMap(piece => piece.entangledTo.map(pieceCoord => new PieceEntanglement(pieces.indexOf(piece), pieces.findIndex(candidate => areCoordsEqual(candidate.position, pieceCoord)), coordinates))),
		};
	}
	return {
		whitePosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(objectPosition.objects.filter(objectSet => objectSet.pieceType.side === Sides.white && objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.partialPieces),
		])),
		blackPosition: Object.fromEntries(Object.keys(defaultGamePosition.whitePosition).map(pieceKey => [
			pieceKey,
			piecesToPieceSet(objectPosition.objects.filter(objectSet => objectSet.pieceType.side === Sides.black && objectSet.pieceType.type_p === keyToPiece(pieceKey))[parseInt(pieceKey[1]!) - 1]?.partialPieces),
		])),
		otherData: structuredClone(objectPosition.otherData),
	};
}

export function ValidPositionCheck(gamePosition: GamePosition): boolean {
	try {
		new ChessboardPosition(positionToObjects(gamePosition).objects);
		const properKeys: string[] = ["", ...Object.keys(defaultGamePosition.whitePosition)] as const;
		const candidateKeys: string[] = ["", ...Object.keys(gamePosition.whitePosition), "", ...Object.keys(gamePosition.blackPosition)] as const;
		return [...Array(candidateKeys.length).keys()].every(pieceIndex => !candidateKeys[pieceIndex] || properKeys.indexOf(candidateKeys[pieceIndex]) > properKeys.indexOf(candidateKeys[pieceIndex - 1]!)) &&
		       candidateKeys.indexOf("k1") !== candidateKeys.lastIndexOf("k1") &&
		       [...filteredEntries(gamePosition.whitePosition), ...filteredEntries(gamePosition.blackPosition)].every((pieceEntry: [string, PieceSet]) => pieceEntry[1].positions.reduce((accumulator, current) => ({
			       x: 1,
			       y: 1,
			       probability: Fraction.sum(accumulator.probability, current.probability)
		       })).probability.lessThanOrEqual(new Fraction) && (pieceEntry[0][0] !== "p" || pieceEntry[1].positions.every(pieceCoord => (![1, 8].includes(pieceCoord.y) || pieceCoord.promotion) && ([Pieces.knight, Pieces.bishop, Pieces.rook, Pieces.queen, undefined] as any[]).includes(pieceCoord.promotion))) && (pieceEntry[0][0] === "p" || pieceEntry[1].positions.every(pieceCoord => !pieceCoord.promotion))) &&
		       (!gamePosition.otherData.enpassant || [4, 5].includes((gamePosition.otherData.enpassant as Coord).y) && (gamePosition.otherData.whoseTurn === Sides.white ? filteredEntries(gamePosition.blackPosition) : filteredEntries(gamePosition.whitePosition)).some((pieceEntry: [string, PieceSet]) => pieceEntry[0][0] === "p" && pieceEntry[1].positions.some(pieceCoord => !pieceCoord.promotion && areCoordsEqual(gamePosition.otherData.enpassant as Coord, pieceCoord)))) &&
			   (!gamePosition.otherData.castling.canWhiteCastleLeft  || JSON.stringify(gamePosition.whitePosition.k1!.positions[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r1?.positions[0]) === '{"x":1,"y":1,"probability":{"numerator":1,"denominator":1}}') &&
			   (!gamePosition.otherData.castling.canWhiteCastleRight || JSON.stringify(gamePosition.whitePosition.k1!.positions[0]) === '{"x":5,"y":1,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.whitePosition.r2?.positions[0]) === '{"x":8,"y":1,"probability":{"numerator":1,"denominator":1}}') &&
			   (!gamePosition.otherData.castling.canBlackCastleLeft  || JSON.stringify(gamePosition.blackPosition.k1!.positions[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r1?.positions[0]) === '{"x":1,"y":8,"probability":{"numerator":1,"denominator":1}}') &&
			   (!gamePosition.otherData.castling.canBlackCastleRight || JSON.stringify(gamePosition.blackPosition.k1!.positions[0]) === '{"x":5,"y":8,"probability":{"numerator":1,"denominator":1}}' && JSON.stringify(gamePosition.blackPosition.r2?.positions[0]) === '{"x":8,"y":8,"probability":{"numerator":1,"denominator":1}}');
	} catch {
		return false;
	}
}

export function isValidString(stringCandidate: string): boolean {
	try {
		return ValidPositionCheck(getPositionFromString(stringCandidate)) && getPositionString(getPositionFromString(stringCandidate)) === stringCandidate && [...Array(stringCandidate.length - 4).keys()].every((index: number) => !["Na", "0|", "9|", ",-"].includes(stringCandidate.slice(index, index + 2)));
	} catch {
		return false;
	}
}

export function isValidPosition(positionCandidate: GamePosition): boolean {
	try {
		return isValidString(getPositionString(positionCandidate));
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
		noCapture: boolean;
		checkOnly: boolean;
		noCheck: boolean;
		nonLeaping: boolean;
	},
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
		noCapture: false,
		checkOnly: false,
		noCheck: false,
		nonLeaping: false,
	},
} as const;
