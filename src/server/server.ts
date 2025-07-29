import express from "express";
 
const app: express.Application = express();
const port: number = 3000;

app.get('/', (_req, _res) => {
	_res.sendFile("quantum chess.html", { root: "src" });
});

app.listen(port, () => {
	console.log(`http://localhost:${port}/`);
});

/* import * as logic from "../backend/logic.js";
import * as meta from "../backend/metatypes.js";
import * as piece from "../backend/piecetypes.js";

console.log(meta.isValidPositionString("turn: white, castling: wl true wr true bl true br true, enpassant: false, qubits: w 0 b 0|P1: (a2,1/1)|P2: (b2,1/1)|P3: (c2,1/1)|P4: (d2,1/1)|P5: (e2,1/1)|P6: (f2,1/1)|P7: (g2,1/1)|P8: (h2,1/1)|R1: (a1,1/1)|N1: (b1,1/1)|B1: (c1,1/1)|Q1: (d1,1/1)|K1: (e1,1/1)|B2: (f1,1/1)|N2: (g1,1/1)|R2: (h1,1/1)|p1: (a7,1/1)|p2: (b7,1/1)|p3: (c7,1/1)|p4: (d7,1/1)|p5: (e7,1/1)|p6: (f7,1/1)|p7: (g7,1/1)|p8: (h7,1/1)|r1: (a8,1/1)|n1: (b8,1/1)|b1: (c8,1/1)|q1: (d8,1/1)|k1: (e8,1/1)|b2: (f8,1/1)|n2: (g8,1/1)|r2: (h8,1/1)"));
console.log(logic.isMoveLegal({ move: { start: { x: 5, y: 4 }, end: { x: 6, y: 5 } }, declarations: new Set(["nonLeaping", "captureOnly"]) }, logic.getResultOfMove({ pushedPawn: { x: 6, y: 7 } }, logic.getResultOfMove({ pushedPawn: { x: 5, y: 2 }}, piece.defaultPosition, true)))); */
