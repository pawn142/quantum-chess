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
	if (window.gameOver) {
		window.turnCounter.innerHTML = (window.position.otherData.whoseTurn === piece.Sides.white ? "Black" : "White") + " wins";
		window.turnCounter.style.color = piece.otherSide(window.position.otherData.whoseTurn);
	} else {
		window.turnCounter.innerHTML = (window.position.otherData.whoseTurn === piece.Sides.white ? "White" : "Black") + " to move";
		window.turnCounter.style.color = window.position.otherData.whoseTurn;
	}
}

export function createArrow(start: piece.Coord, end: piece.Coord, type: "primary" | "default", color = type === "primary" ? "white" : window.ringColor): void {
	const arrow = document.createElement("div");
	arrow.className = "arrow " + type;
	arrow.id = type[0] + start.x + start.y + end.x + end.y;
	arrow.index = type === "primary" ? window.play.primaryMoves.length : window.play.defaultMoves.length;
	window.arrowpool.append(arrow);
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
	Object.assign(tools.createCover(arrow).style, {
		width: arrow.offsetWidth * 100 / window.innerHeight - 3.5 + "vh",
		"background-color": color,
	});
	Object.assign(tools.createCover(arrow).style, {
		top: "-2vh",
		right: 0,
		width: 0,
		height: 0,
		border: "solid",
		"border-left-width": "3.5vh",
		"border-top-width": "3vh",
		"border-bottom-width": "3vh",
		"border-color": "transparent transparent transparent " + color,
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
	const mainPerspective: boolean = window.visualSettings.perspective === piece.Sides.white;
	window.arrowpool.style.rotate = mainPerspective ? "0" : "180deg";
	window.whiteCoordinates.style.visibility = window.visualSettings.showCoordinates && mainPerspective ? "visible" : "hidden";
	window.blackCoordinates.style.visibility = window.visualSettings.showCoordinates && !mainPerspective ? "visible" : "hidden";
	for (let i = 0; i < 64; ++i) {
		const squareDiv: HTMLDivElement = window["square" + i];
		Object.assign(squareDiv.style, {
			top: 12.5 * (mainPerspective ? 8 - squareDiv.coord.y : squareDiv.coord.y - 1) + "%",
			left: 12.5 * (mainPerspective ? squareDiv.coord.x - 1 : 8 - squareDiv.coord.x) + "%",
			width: "12.5%",
			height: "12.5%",
		});
	}
	for (const object of objectPosition.objects) {
		for (const unit of object.units) {
			const unitDiv: HTMLDivElement = tools.createCover(window["square" + piece.coordToIndex(unit.state)]);
			unitDiv.id = piece.coordToIndex(unit.state).toString();
			if (window.visualSettings.showFullRings || unit.state.probability.lessThan(new Fraction)) {
				const probabilityDiv: HTMLDivElement = tools.createCover(unitDiv);
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
			if (window.gameOver && object.pieceType.type_p === piece.Pieces.king && object.pieceType.side === objectPosition.otherData.whoseTurn) {
				unitImg.style.rotate = "-90deg";
			}
		}
	}
	window["qubits" + (mainPerspective ? "White" : "Black")] = document.getElementById("qubits-white");
	window["qubits" + (mainPerspective ? "Black" : "White")] = document.getElementById("qubits-black");
	window.position = objectPosition;
	updateTurnCounter();
	window.objects = objectPosition.objects;
	window.qubitsWhite.innerHTML = objectPosition.otherData.qubits.whiteBalance.toString();
	window.qubitsBlack.innerHTML = objectPosition.otherData.qubits.blackBalance.toString();
}

export function resetPosition(): void {
	window.gameOver = false;
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
	window.arrowpool = tools.createCover(window.board);
	window.arrowpool.style["z-index"] = "1";
	window.whiteCoordinates = document.getElementById("coordinates-white");
	window.blackCoordinates = document.getElementById("coordinates-black");
	window.turnCounter = document.getElementById("turn-counter");
	window.import_export = document.getElementById("import-export");
	window.volumeSlider = document.querySelector(".slider");
	window.gameSettings = meta.defaultSettings;
	window.visualSettings = tools.defaultVisuals;
	window.settingsMenu = document.getElementById("settings");
	window.sounds = {};
	window.sounds.capture = new Audio("assets/sounds/capture.webm");
	window.sounds.move = new Audio("assets/sounds/move.webm");
	window.sounds.check = new Audio("assets/sounds/check.mp3");
	window.sounds.split = new Audio("assets/sounds/move.webm");
	window.sounds.invalidated = new Audio("assets/sounds/illegal.webm");
	window.sounds.castle = new Audio("assets/sounds/castle.mp3");
	window.sounds.promote = new Audio("assets/sounds/promote.mp3");
	for (const coord of piece.chessboard) {
		const squareDiv: HTMLDivElement = document.createElement("div");
		window.board.append(squareDiv);
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
				const previousArrow: HTMLDivElement | null = document.querySelector(`[id$="${window.selection.coord.x.toString() + window.selection.coord.y + coord.x + coord.y}"]`);
				if (!window.gameOver && (previousArrow || matchingMove && logic.generatePossiblePositions(window.position, window.play.objectIndex, window.position.objects[window.play.objectIndex].units.findIndex(unit => piece.areCoordsEqual(unit.state, window.selection.coord))).some(possiblePosition => logic.isMoveLegal(matchingMove, possiblePosition, window.gameSettings.winByCheckmate)))) {
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
								delete window.play.defaultMoves[previousArrow.index];
							}
						}
					} else {
						if (clickType === "left") {
							createArrow(window.selection.coord, coord, "primary");
							window.play.primaryMoves.push(matchingMove);
						} else {
							const replacedDefault: HTMLDivElement | null = document.querySelector(`[id^="${'d' + window.selection.coord.x + window.selection.coord.y}"]`);
							if (replacedDefault) {
								replacedDefault.remove();
								delete window.play.defaultMoves[window.play.defaultMoves.findIndex(defaultMove => defaultMove && piece.areCoordsEqual(logic.generateStartMiddleEnd(defaultMove.move)[0], window.selection.coord))];
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
	if (!window.gameOver) {
		clearPlay();
		window.position.otherData.whoseTurn = piece.otherSide(window.position.otherData.whoseTurn);
		updateTurnCounter();
	}
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
	filteredPlay.defaultMoves = filteredPlay.defaultMoves.filter(i => i);
	if (!logic.isPlayLegal(filteredPlay, window.position, window.gameSettings)) {
		console.log("Play failed: " + [...logic.checkPlayValidity(filteredPlay, window.position, window.gameSettings)][0]);
		return;
	}
	window.play.primaryMoves = filteredPlay.primaryMoves;
	window.play.defaultMoves = filteredPlay.defaultMoves;
	const previousPosition: any[] = [];
	previousPosition.push(Fraction.fractionalClone(window.position));
	const playResults: [ObjectPosition, boolean] = logic.generatePlayResults(window.play, window.position, window.gameSettings);
	previousPosition.push(playResults[1], playResults[2]);
	window.previous.positions.push(previousPosition);
	window.previous.plays.push(window.play);
	setVolume();
	tools.playSound(window.sounds[playResults[1]]);
	window.gameOver = playResults[2];
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
		window.gameOver = false;
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
		setVolume();
		tools.playSound(window.sounds[window.redo.positions.at(-1)[1]]);
		window.gameOver = window.redo.positions.at(-1)[2];
		showPosition(window.redo.positions.at(-1)[0]);
		showPlay(window.redo.plays.at(-1));
		window.redo.positions.pop();
		window.redo.plays.pop();
	}
}

export function flipBoard(): void {
	window.visualSettings.perspective = piece.otherSide(window.visualSettings.perspective);
	regeneratePosition();
}
