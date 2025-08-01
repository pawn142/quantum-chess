import express from "express";
 
export const app: express.Application = express();
export const port: number = 3000;

app.use(express.static("/quantum chess"));

app.get('/', (_req, _res) => {
	_res.sendFile("webpage.html", { root: "pages" });
});

app.listen(port, () => {
	console.log(`http://localhost:${port}/`);
});
