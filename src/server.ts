import express from "express";
import path from "path";
 
export const app: express.Application = express();
export const port: number = 3000;

app.use(express.static(path.dirname("src")));

app.get('/', (_req, _res) => {
	_res.sendFile("editor.html", { root: "pages" });
});

app.listen(port, () => {
	console.log(`http://localhost:${port}/`);
});
