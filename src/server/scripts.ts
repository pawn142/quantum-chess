// @ts-nocheck

import Fraction from "../backend/arithmetic.js";

import * as logic from "../backend/logic.js";
import * as meta from "../backend/metatypes.js";
import * as piece from "../backend/piecetypes.js";
import * as random from "../backend/random.js";

import * as tools from "./toolbox.js";

export function test(): void {
	console.log(meta.isValidPositionString("turn: white, castling: wl true wr true bl true br true, enpassant: false, qubits: w 0 b 0|P1: (a2,1/1)|P2: (b2,1/1)|P3: (c2,1/1)|P4: (d2,1/1)|P5: (e2,1/1)|P6: (f2,1/1)|P7: (g2,1/1)|P8: (h2,1/1)|R1: (a1,1/1)|N1: (b1,1/1)|B1: (c1,1/1)|Q1: (d1,1/1)|K1: (e1,1/1)|B2: (f1,1/1)|N2: (g1,1/1)|R2: (h1,1/1)|p1: (a7,1/1)|p2: (b7,1/1)|p3: (c7,1/1)|p4: (d7,1/1)|p5: (e7,1/1)|p6: (f7,1/1)|p7: (g7,1/1)|p8: (h7,1/1)|r1: (a8,1/1)|n1: (b8,1/1)|b1: (c8,1/1)|q1: (d8,1/1)|k1: (e8,1/1)|b2: (f8,1/1)|n2: (g8,1/1)|r2: (h8,1/1)") &&
	logic.isMoveLegal({ move: { start: { x: 5, y: 4 }, end: { x: 6, y: 5 } }, declarations: new Set(["nonLeaping", "captureOnly"]) }, logic.getResultOfMove({ pushedPawn: { x: 6, y: 7 } }, logic.getResultOfMove({ pushedPawn: { x: 5, y: 2 }}, piece.defaultPosition, true))));
}

export function clearBoard(): void {
	for (let i = 0; i < 64; ++i) {
		const unitDiv: HTMLDivElement | null = document.getElementById(i.toString());
		if (unitDiv) {
			unitDiv.remove();
		}
	}
	window.turnCounter.innerHTML = "";
	window.position = undefined;
	window.objects = [];
}

export function showPosition(objectPosition: piece.ObjectPosition): void {
	clearBoard();
	document.getElementById("coordinates").style.visibility = window.visualSettings.showCoordinates ? "visible" : "hidden";
	for (const object of objectPosition.objects) {
		for (const unit of object.units) {
			const unitDiv: HTMLDivElement = tools.createCover(window["square" + piece.coordToIndex(unit.state)], "div");
			unitDiv.id = piece.coordToIndex(unit.state).toString();
			if (!window.visualSettings.hideFullProbabilities || unit.state.probability.lessThan(new Fraction)) {
				const probabilityDiv: HTMLDivElement = tools.createCover(unitDiv, "div");
				Object.assign(probabilityDiv.style, {
					width: "90%",
					height: "90%",
					top: "5%",
					left: "5%",
					"border-radius": "50%",
					background: `linear-gradient(to top, ${window.ringColor} ${100 * unit.state.probability.value()}%, transparent ${100 * unit.state.probability.value()}%)`,
				});
				if (!window.visualSettings.fillRingCenters) {
					probabilityDiv.style.mask = `radial-gradient(circle, transparent 42%, black 42%)`;
				}
			}
			const unitImg: HTMLImageElement = tools.createCover(unitDiv, "img");
			unitImg.src = tools.getPieceImage(unit.state.promotion ?? object.pieceType.type_p, object.pieceType.side);
		}
	}
	window.turnCounter.innerHTML = (objectPosition.otherData.whoseTurn === piece.Sides.white ? "White" : "Black") + " to move";
	window.position = objectPosition;
	window.objects = objectPosition.objects;
}

export function resetPosition(): void {
	showPosition(logic.initializeObjectPosition(window.gameSettings.unlimitedQubits));
}

export function regeneratePosition(): void {
	showPosition(window.position);
}

export function setup(): void {
	random.clear();
	random.addRandomToStream(10000);
	window.ringColor = "#FC8EAC";
	window.gameSettings = meta.defaultSettings;
	window.visualSettings = tools.defaultVisuals;
	window.board = document.getElementById("board");
	window.turnCounter = document.getElementById("turn-counter");
	for (const coord of piece.chessboard) {
		const squareDiv: HTMLDivElement = document.createElement("div");
		window.board.append(squareDiv);
		Object.assign(squareDiv.style, {
			position: "absolute",
			width: "12.5%",
			height: "12.5%",
			top: 12.5 * (8 - coord.y) + "%",
			left: 12.5 * (coord.x - 1) + "%",
		});
		window["square" + piece.coordToIndex(coord)] = squareDiv;
		const squareButton: HTMLButtonElement = tools.createCover(squareDiv, "button");
		Object.assign(squareButton.style, {
			visibility: "hidden",
			border: "none",
			"z-index": "2",
		});
		window["button" + piece.coordToIndex(coord)] = squareButton;
	}
	resetPosition();
}
