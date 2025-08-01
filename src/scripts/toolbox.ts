import { Pieces, Sides } from "../backend/piecetypes.js";

export function getPieceImage(pieceType: keyof typeof Pieces, side: keyof typeof Sides): string {
	return `assets/piece assets/${pieceType + side[0]!.toUpperCase()}.png`;
}

export interface VisualSettings {
	hideFullProbabilities: boolean;
	fillRingCenters: boolean;
	showCoordinates: boolean;
}

export const defaultVisuals: VisualSettings = {
	hideFullProbabilities: true,
	fillRingCenters: false,
	showCoordinates: false,
} as const;

export function createCover(parent: HTMLElement, elementType: string): HTMLElement {
	const cover: HTMLElement = document.createElement(elementType);
	parent.append(cover);
	Object.assign(cover.style, {
		position: "absolute",
		width: "100%",
		height:  "100%",
	});
	return cover;
}
