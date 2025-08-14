import { defaultData, Pieces, Sides } from "../backend/piecetypes.js";

export interface VisualSettings {
	perspective: keyof typeof Sides;
	showFullRings: boolean;
	fillRingCenters: boolean;
	showCoordinates: boolean;
}

export const defaultVisuals: VisualSettings = {
	perspective: defaultData.whoseTurn,
	showFullRings: false,
	fillRingCenters: false,
	showCoordinates: false,
} as const;

export const Sounds = {
	capture: "capture",
	move: "move",
	check: "check",
	split: "split",
	invalidated: "invalidated",
	castle: "castle",
	promote: "promote",
} as const;

export function getPieceImage(pieceType: keyof typeof Pieces, side: keyof typeof Sides): string {
	return `assets/pieces/${pieceType + side[0]!.toUpperCase()}.png`;
}

export function createCover(parent: HTMLElement, elementType: string = "div"): HTMLElement {
	const cover: HTMLElement = document.createElement(elementType);
	parent.append(cover);
	cover.style.width = "100%";
	cover.style.height = "100%";
	return cover;
}

export function playSound(sound: HTMLAudioElement): void {
	sound.pause();
	sound.currentTime = 0;
	sound.play();
}
