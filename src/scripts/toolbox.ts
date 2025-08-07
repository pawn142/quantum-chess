import { Pieces, Sides } from "../backend/piecetypes.js";

export function getPieceImage(pieceType: keyof typeof Pieces, side: keyof typeof Sides): string {
	return `assets/pieces/${pieceType + side[0]!.toUpperCase()}.png`;
}

export interface VisualSettings {
	showFullRings: boolean;
	fillRingCenters: boolean;
	showCoordinates: boolean;
}

export const defaultVisuals: VisualSettings = {
	showFullRings: false,
	fillRingCenters: false,
	showCoordinates: false,
} as const;

export function createCover(parent: HTMLElement, elementType: string): HTMLElement {
	const cover: HTMLElement = document.createElement(elementType);
	parent.append(cover);
	cover.style.width = "100%";
	cover.style.height = "100%";
	return cover;
}
