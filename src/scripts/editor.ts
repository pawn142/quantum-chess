// @ts-nocheck

import Fraction from "../backend/arithmetic.js";

import * as logic from "../backend/logic.js";
import * as meta from "../backend/metatypes.js";
import * as piece from "../backend/piecetypes.js";
import * as random from "../backend/random.js";

import * as tools from "./toolbox.js";

export function clearBoardElements(): void {
	for (let i = 0; i < 64; ++i) {
		const unitDiv: HTMLDivElement | null = document.getElementById(i.toString());
		if (unitDiv) {
			unitDiv.remove();
		}
	}
}

export function clearPlay(): void {
	while (document.querySelector(".arrow")) {
		document.querySelector(".arrow").remove();
	}
	window.play = {
		objectIndex: undefined,
		primaryMoves: [],
		defaultMoves: [],
	};
	removeSelection();
}

export function clearUndoTree(): void {
	window.previous.positions.length = 0;
	window.previous.plays.length = 0;
	window.redo.positions.length = 0;
	window.redo.plays.length = 0;
}

export function clearBoard(): void {
	window.position.objects = [];
	window.objects = [];
	clearBoardElements();
	clearPlay();
	clearUndoTree();
}

export function removeAnnotation(): void {
	if (window.annotation) {
		window.annotation.style["background-color"] = "transparent";
		window.annotation = undefined;
	}
}

export function removeSelection(): void {
	if (window.selection) {
		window.selection.style["background-color"] = "transparent";
		window.selection = undefined;
	}
}

export function updateTurnCounter(): void {
	window.turnCounter.innerHTML = (window.position.otherData.whoseTurn === piece.Sides.white ? "White" : "Black") + " to move";
	window.turnCounter.style.color = window.position.otherData.whoseTurn;
}

export function createArrow(start: piece.Coord, end: piece.Coord, type: "primary" | "default", color = type === "primary" ? "white" : window.ringColor): void {
	const arrow = document.createElement("div");
	arrow.className = "arrow " + type;
	arrow.id = start.x.toString() + start.y + end.x + end.y;
	arrow.index = type === "primary" ? window.play.primaryMoves.length : window.play.defaultMoves.length;
	window.board.append(arrow);
	const diff_x: number = end.x - start.x;
	const diff_y: number = end.y - start.y;
	const hypotenuse: number = Math.sqrt(diff_x ** 2 + diff_y ** 2);
	Object.assign(arrow.style, {
		bottom: (start.y + end.y) * 6.25 - 7.75 + "%",
		width: hypotenuse * 12.5 + "%",
		height: "3%",
		rotate: (diff_x < 0 ? Math.PI : 0) - Math.atan(diff_y / diff_x) + "rad",
		opacity: 0.8,
	});
	arrow.style.left = (start.x + end.x - hypotenuse - 1) * 6.25 + "%";
	Object.assign(tools.createCover(arrow, "div").style, {
		width: arrow.offsetWidth * 100 / window.innerHeight - 3.5 + "vh",
		"background-color": color,
		"z-index": "1",
	});
	Object.assign(tools.createCover(arrow, "div").style, {
		top: "-2vh",
		right: 0,
		width: 0,
		height: 0,
		border: "solid",
		"border-left-width": "3.5vh",
		"border-top-width": "3vh",
		"border-bottom-width": "3vh",
		"border-color": "transparent transparent transparent " + color,
		"z-index": "1",
	});
}

export function showPlay(play: piece.Play): void {
	clearPlay();
	play.primaryMoves.forEach(primaryMove => {
		createArrow(logic.generateStartMiddleEnd(primaryMove.move)[0], logic.generateStartMiddleEnd(primaryMove.move)[2], "primary");
		window.play.primaryMoves.push(primaryMove);
	});
	play.defaultMoves.forEach(defaultMove => {
		createArrow(logic.generateStartMiddleEnd(defaultMove.move)[0], logic.generateStartMiddleEnd(defaultMove.move)[2], "default");
		window.play.defaultMoves.push(defaultMove);
	});
	window.play.objectIndex = play.objectIndex;
}

export function showPosition(objectPosition: piece.ObjectPosition): void {
	clearBoardElements();
	window.coordinates.style.visibility = window.visualSettings.showCoordinates ? "visible" : "hidden";
	for (const object of objectPosition.objects) {
		for (const unit of object.units) {
			const unitDiv: HTMLDivElement = tools.createCover(window["square" + piece.coordToIndex(unit.state)], "div");
			unitDiv.id = piece.coordToIndex(unit.state).toString();
			if (window.visualSettings.showFullRings || unit.state.probability.lessThan(new Fraction)) {
				const probabilityDiv: HTMLDivElement = tools.createCover(unitDiv, "div");
				Object.assign(probabilityDiv.style, {
					top: "5%",
					left: "5%",
					width: "90%",
					height: "90%",
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
	window.position = objectPosition;
	updateTurnCounter();
	window.objects = objectPosition.objects;
	window.qubitsWhite.innerHTML = objectPosition.otherData.qubits.whiteBalance.toString();
	window.qubitsBlack.innerHTML = objectPosition.otherData.qubits.blackBalance.toString();
}

export function resetPosition(): void {
	showPosition(logic.initializeObjectPosition(window.gameSettings.unlimitedQubits));
	clearPlay();
	clearUndoTree();
}

export function regeneratePosition(): void {
	showPosition(window.position);
}

export function setup(): void {
	random.clear();
	random.addRandomToStream(10000);
	window.ringColor = "rgba(255, 42, 81, 0.8)";
	window.board = document.getElementById("board");
	window.board.style.height = 200 / 3 + "%";
	window.coordinates = document.getElementById("coordinates");
	window.turnCounter = document.getElementById("turn-counter");
	window.qubitsWhite = document.getElementById("qubits-white");
	window.qubitsBlack = document.getElementById("qubits-black");
	window.import_export = document.getElementById("import-export");
	window.volumeSlider = document.querySelector(".slider");
	window.gameSettings = meta.defaultSettings;
	window.visualSettings = tools.defaultVisuals;
	window.settingsMenu = document.getElementById("settings");
	window.sounds = {};
	window.sounds.capture = new Audio("assets/sounds/capture.webm");
	window.sounds.move = new Audio("assets/sounds/move.webm");
	window.sounds.check = new Audio();
	window.sounds.split = new Audio();
	window.sounds.invalidated = new Audio();
	for (const coord of piece.chessboard) {
		const squareDiv: HTMLDivElement = document.createElement("div");
		window.board.append(squareDiv);
		Object.assign(squareDiv.style, {
			top: 12.5 * (8 - coord.y) + "%",
			left: 12.5 * (coord.x - 1) + "%",
			width: "12.5%",
			height: "12.5%",
		});
		squareDiv.coord = coord;
		squareDiv.index = piece.coordToIndex(coord);
		window["square" + squareDiv.index] = squareDiv;
		const squareButton: HTMLButtonElement = tools.createCover(squareDiv, "button");
		Object.assign(squareButton.style, {
			border: "none",
			"background-color": "transparent",
			"z-index": "2",
		});
		function handleClick(clickType: "left" | "right"): void {
			function switchSelection(): void {
				if (window.annotation && piece.areCoordsEqual(window.annotation.coord, coord)) {
					removeAnnotation();
				}
				if (window.play.objectIndex && !window.position.objects[window.play.objectIndex].units.includes(piece.findUnit(piece.getSide(window.position), coord))) {
					clearPlay();
				}
				removeSelection();
				squareDiv.style["background-color"] = "yellow";
				window.selection = squareDiv;
				window.play.objectIndex = window.position.objects.indexOf(piece.findObject(window.position, coord));
			}
			if (!window.selection) {
				if (clickType === "left") {
					if (piece.findUnit(piece.getSide(window.position), coord)) {
						switchSelection();
					}
					return;
				}
			} else {
				const matchingMove: piece.DeclaredMove | undefined = logic.candidateMoves(piece.findUnit(piece.getSide(window.position), window.selection.coord), window.position).find(candidateMove => piece.areCoordsEqual(logic.generateStartMiddleEnd(candidateMove.move)[2], coord));
				if (matchingMove && logic.generatePossiblePositions(window.position, window.play.objectIndex, window.position.objects[window.play.objectIndex].units.findIndex(unit => piece.areCoordsEqual(unit.state, window.selection.coord))).some(possiblePosition => logic.isMoveLegal(matchingMove, possiblePosition, window.gameSettings.winByCheckmate))) {
					const previousArrow: HTMLElement | null = document.getElementById(window.selection.coord.x.toString() + window.selection.coord.y + coord.x + coord.y);
					if (previousArrow) {
						if (previousArrow.classList.contains("primary")) {
							if (clickType === "left") {
								previousArrow.remove();
								delete window.play.primaryMoves[previousArrow.index];
							} else {
								createArrow(window.selection.coord, coord, "primary");
								window.play.primaryMoves.push(matchingMove);
							}
						} else {
							if (clickType === "right") {
								previousArrow.remove();
								window.play.defaultMoves.length = 0;
							}
						}
					} else {
						if (clickType === "left") {
							createArrow(window.selection.coord, coord, "primary");
							window.play.primaryMoves.push(matchingMove);
						} else {
							if (window.play.defaultMoves.length) {
								document.querySelector(".default").remove();
								window.play.defaultMoves.length = 0;
							}
							createArrow(window.selection.coord, coord, "default");
							window.play.defaultMoves.push(matchingMove);
						}
					}
					return;
				} else {
					if (clickType === "left") {
						if (piece.findUnit(piece.getSide(window.position), coord)) {
							if (piece.areCoordsEqual(window.selection.coord, coord)) {
								removeSelection();
							} else {
								switchSelection();
							}
						}
						return;
					}
				}
			}
			if (window.selection !== squareDiv) {
				if (window.annotation === squareDiv) {
					removeAnnotation();
				} else {
					removeAnnotation();
					window.annotation = squareDiv;
					squareDiv.style["background-color"] = "purple";
				}
			}
			return;
		};
		squareButton.onclick = function() {
			handleClick("left");
		};
		squareButton.oncontextmenu = function() {
			handleClick("right");
			return false;
		};
		window["button" + squareDiv.index] = squareButton;
	}
	window.previous = {
		whiteBalance: 0,
		blackBalance: 0,
		positions: [],
		plays: [],
	};
	window.redo = {
		positions: [],
		plays: [],
	};
	resetPosition();
}

export function changeSide(): void {
	clearPlay();
	window.position.otherData.whoseTurn = piece.otherSide(window.position.otherData.whoseTurn);
	updateTurnCounter();
}

export function toggleInfiniteQubits(side: keyof typeof piece.Sides): void {
	if (side === piece.Sides.white) {
		if (window.qubitsWhite.innerHTML === Infinity.toString()) {
			window.qubitsWhite.innerHTML = window.previous.whiteBalance;
			window.position.otherData.qubits.whiteBalance = window.previous.whiteBalance;
		} else {
			window.qubitsWhite.innerHTML = Infinity.toString();
			window.previous.whiteBalance = window.position.otherData.qubits.whiteBalance;
			window.position.otherData.qubits.whiteBalance = Infinity;
		}
	} else {
		if (window.qubitsBlack.innerHTML === Infinity.toString()) {
			window.qubitsBlack.innerHTML = window.previous.blackBalance;
			window.position.otherData.qubits.blackBalance = window.previous.blackBalance;
		} else {
			window.qubitsBlack.innerHTML = Infinity.toString();
			window.previous.blackBalance = window.position.otherData.qubits.blackBalance;
			window.position.otherData.qubits.blackBalance = Infinity;
		}
	}
}

export function importPosition(): void {
	if (logic.isValidStartingObjectsString(window.import_export.value)) {
		showPosition(logic.getObjectsFromString(window.import_export.value));
		clearPlay();
	} else {
		console.log("Import failed");
	}
}

export function exportPosition(): void {
	window.import_export.value = logic.getObjectsString(window.position);
}

export function setVolume(): void {
	for (const sound of Object.keys(tools.Sounds)) {
		window.sounds[sound].volume = window.volumeSlider.value / 100;
	}
}

export function makePlay(): void {
	const filteredPlay: piece.Play = structuredClone(window.play);
	filteredPlay.primaryMoves = filteredPlay.primaryMoves.filter(i => i);
	if (!logic.isPlayLegal(filteredPlay, window.position, window.gameSettings)) {
		console.log("Play failed: " + [...logic.checkPlayValidity(window.play, window.position, window.gameSettings)][0]);
		return;
	}
	window.play.primaryMoves = filteredPlay.primaryMoves;
	const previousPosition: any[] = [];
	previousPosition.push(Fraction.fractionalClone(window.position));
	const playResults: [ObjectPosition, boolean] = logic.generatePlayResults(window.play, window.position, window.gameSettings);
	previousPosition.push(playResults[1]);
	window.previous.positions.push(previousPosition);
	window.previous.plays.push(window.play);
	setVolume();
	tools.playSound(window.sounds[playResults[1]]);
	showPosition(playResults[0]);
	clearPlay();
	window.redo.positions.length = 0;
	window.redo.plays.length = 0;
}

export function undoPlay(): void {
	if (window.previous.positions.length) {
		if (window.position.objects.length) {
			window.redo.positions.push([Fraction.fractionalClone(window.position), ...window.previous.positions.at(-1).slice(1)]);
			window.redo.plays.push(window.play);
		}
		showPosition(window.previous.positions.at(-1)[0]);
		showPlay(window.previous.plays.at(-1));
		window.previous.positions.pop();
		window.previous.plays.pop();
	}
}

export function redoPlay(): void {
	if (window.redo.positions.length) {
		window.previous.positions.push([Fraction.fractionalClone(window.position), ...window.redo.positions.at(-1).slice(1)]);
		window.previous.plays.push(window.play);
		showPosition(window.redo.positions.at(-1)[0]);
		showPlay(window.redo.plays.at(-1));
		setVolume();
		tools.playSound(window.sounds[window.redo.positions.at(-1)[1]]);
		window.redo.positions.pop();
		window.redo.plays.pop();
	}
}
