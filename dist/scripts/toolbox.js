import { defaultData } from "../backend/piecetypes.js";
export const defaultVisuals = {
    perspective: defaultData.whoseTurn,
    showFullRings: false,
    fillRingCenters: false,
    showCoordinates: false,
};
export const Sounds = {
    capture: "capture",
    move: "move",
    check: "check",
    split: "split",
    invalidated: "invalidated",
    castle: "castle",
    promote: "promote",
};
export function getPieceImage(pieceType, side) {
    return `assets/pieces/${pieceType + side[0].toUpperCase()}.png`;
}
export function createCover(parent, elementType = "div") {
    const cover = document.createElement(elementType);
    parent.append(cover);
    cover.style.width = "100%";
    cover.style.height = "100%";
    return cover;
}
export function playSound(sound) {
    sound.pause();
    sound.currentTime = 0;
    sound.play();
}
