import Fraction from './arithmetic.ts';
import { chessboard, CompletedPiece, Coord, EntangledPiece, IncompletePiece, ObjectSet, PartialCoord, Pieces, Sides, WeightedCoord } from './piecetypes.ts';

export const boardFiles: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function coordserialize(coordinate: Coord): string {
	return boardFiles[coordinate.x - 1] + coordinate.y.toString();
}

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
	whoseTurn: keyof typeof Sides;
	castling: {
		canWhiteCastle: boolean;
		canBlackCastle: boolean;
	};
	enpassant: Coord | false;
}

export interface CompletedPosition {
	whitePosition: CompletedHalfPosition;
	blackPosition: CompletedHalfPosition;
	whoseTurn?: keyof typeof Sides;
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
		q1: {x: 4, y: 1},
		k1: {x: 5, y: 1},
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
		q1: {x: 4, y: 8},
		k1: {x: 5, y: 8},
		b2: {x: 6, y: 8},
		n2: {x: 7, y: 8},
		r2: {x: 8, y: 8},
	},
	whoseTurn: Sides.white,
	castling: {
		canWhiteCastle: true,
		canBlackCastle: true,
	},
	enpassant: false,
} as const;

export function completedPositionToPosition(completedPosition: CompletedPosition): GamePosition {
	return {
		whitePosition: Object.fromEntries(Object.entries(completedPosition.whitePosition).map(([whiteCoordKey, whiteCoord]: [string, Coord]) => [
			whiteCoordKey,
			{
				positions: [Object.fromEntries([...Object.entries(whiteCoord), ["probability", new Fraction(1, 1)]])],
				pieceEntanglements: [],
			},
		])),
		blackPosition: Object.fromEntries(Object.entries(completedPosition.blackPosition).map(([blackCoordKey, blackCoord]: [string, Coord]) => [
			blackCoordKey,
			{
				positions: [Object.fromEntries([...Object.entries(blackCoord), ["probability", new Fraction(1, 1)]])],
				pieceEntanglements: [],
			},
		])),
		whoseTurn: (completedPosition.whoseTurn ?? defaultPosition.whoseTurn)!,
		castling: (completedPosition.castling ?? defaultPosition.castling)!,
		enpassant: (completedPosition.enpassant ?? defaultPosition.enpassant)!,
	};
}

export function completedPositionToCompletedObjectPosition(completedPosition: CompletedPosition): CompletedObjectPosition {
	const objectsArray: CompletedObjectPosition = [];
	
	return objectsArray;
}

export function getPositionString(gamePosition: GamePosition): string {
	let positionString: string = `turn: ${gamePosition.whoseTurn}, castling: white ${gamePosition.castling.canWhiteCastle.toString()} black ${gamePosition.castling.canBlackCastle.toString()}, enpassant: ${gamePosition.enpassant ? coordserialize(gamePosition.enpassant) : "false"}`;
	Object.entries(gamePosition.whitePosition).forEach(([whiteKey, whitePiece]: [string, PieceSet]) => {
		let whitePieceString: string = "";
		for (const whiteCoord of whitePiece.positions) {
			whitePieceString += ` (${coordserialize(whiteCoord)},${whiteCoord.probability.serialize() + (whiteCoord.promotion ? "," + whiteCoord.promotion : "")}),`;
		}
		for (const whiteEntanglement of whitePiece.pieceEntanglements) {
			whitePieceString += ` <${whiteEntanglement.from}-${whiteEntanglement.to}>,`;
		}
		positionString += `|${whiteKey[0]!.toUpperCase() + whiteKey.slice(1)}:${whitePieceString.slice(0, -1)}`;
	});
	Object.entries(gamePosition.blackPosition).forEach(([blackKey, blackPiece]: [string, PieceSet]) => {
		let blackPieceString: string = "";
		for (const blackCoord of blackPiece.positions) {
			blackPieceString += ` (${coordserialize(blackCoord)},${blackCoord.probability.serialize() + (blackCoord.promotion ? "," + blackCoord.promotion : "")}),`;
		}
		for (const blackEntanglement of blackPiece.pieceEntanglements) {
			blackPieceString += ` <${blackEntanglement.from}-${blackEntanglement.to}>,`;
		}
		positionString += `|${blackKey}:${blackPieceString.slice(0, -1)}`;
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
				entanglementArray.push(new PieceEntanglement(parseInt(segment.split("-")[0]!.slice(1)), parseInt(segment.split("-")[1]!.slice(0, -1))));
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
		whoseTurn: Sides[metadata[1]!.slice(0, -1) as keyof typeof Sides],
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

export function isValidPosition(positionCandidate: GamePosition): boolean {
	try {
		const properKeys: string[] = ["", ...Object.keys(defaultPosition.whitePosition)] as const;
		const candidateKeys: string[] = ["", ...Object.keys(positionCandidate.whitePosition), "", ...Object.keys(positionCandidate.blackPosition)] as const;
		return [...Array(candidateKeys.length).keys()].every((pieceIndex: number) => !candidateKeys[pieceIndex] || properKeys.indexOf(candidateKeys[pieceIndex]) > properKeys.indexOf(candidateKeys[pieceIndex - 1])) &&
		       candidateKeys.indexOf("k1") !== candidateKeys.lastIndexOf("k1") &&
		       [...Object.entries(positionCandidate.whitePosition), ...Object.entries(positionCandidate.blackPosition)].every((pieceEntry: [string, PieceSet]) => JSON.stringify(pieceEntry[1].positions.reduce((accumulator, current) => ({
			       x: 1,
			       y: 1,
			       probability: Fraction.sum(accumulator.probability, current.probability)
		       })).probability) === '{"numerator":1,"denominator":1}' && (pieceEntry[0][0] !== "p" || pieceEntry[1].positions.every((position: WeightedCoord) => ![1, 8].includes(position.y) || position.promotion))) &&
		       (!positionCandidate.enpassant || [2, 7].includes((positionCandidate.enpassant as Coord).y) && (positionCandidate.whoseTurn === Sides.white ? Object.entries(positionCandidate.blackPosition) : Object.entries(positionCandidate.whitePosition)).some((pieceEntry: [string, PieceSet]) => pieceEntry[0][0] === "p" && pieceEntry[1].positions.some((position: WeightedCoord) => position.x === (positionCandidate.enpassant as Coord).x && [(positionCandidate.enpassant as Coord).y + 2, (positionCandidate.enpassant as Coord).y - 2].includes(position.y))));
	} catch {
		return false;
	}
}

export function isValidString(stringCandidate: string): boolean {
	try {
		return isValidPosition(getPositionFromString(stringCandidate)) && getPositionString(getPositionFromString(stringCandidate)) === stringCandidate && [...Array(stringCandidate.length - 4).keys()].every((index: number) => !["Na", "0|", "9|", "0,", "9,", ",-"].includes(stringCandidate.slice(index, index + 2)));
	} catch {
		return false;
	}
}

export function isStrictlyValidPosition(positionCandidate: GamePosition): boolean {
	try {
		return isValidString(getPositionString(positionCandidate));
	} catch {
		return false;
	}
}
