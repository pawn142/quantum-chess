import express from "express";
 
export const app: express.Application = express();
export const port: number = 3000;

app.use(express.static("src"));

app.get('/', (_req, _res) => {
	_res.sendFile("webpage.html", { root: "src" });
});

app.listen(port, () => {
	console.log(`http://localhost:${port}/`);
});
