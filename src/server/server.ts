import express from 'express';
 
const app: express.Application = express();
const port: number = 3000;

app.get('/', (_req, _res) => {
    _res.send("test");
});

app.listen(port, () => {
    console.log(`http://localhost:${port}/`);
});
