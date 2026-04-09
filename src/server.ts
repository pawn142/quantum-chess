import Fastify from "fastify";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

import CryptoService from "./online/crypto.js";
import AuthService from "./online/auth.js";
import ProfileService from "./online/profile.js";
import MatchmakingService from "./online/matchmaking.js";
import RatingService from "./online/rating.js";
import RoomService from "./online/room.js";
import { SqliteDatabase } from "./online/database.js";
import { registerRoutes } from "./online/routes.js";
import { registerGameWebSocketRoutes } from "./online/ws.js";

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(websocket);

const db = new SqliteDatabase("./data.sqlite");
const crypto = new CryptoService();
const auth = new AuthService(db, crypto);
const profile = new ProfileService(db);
const matchmaking = new MatchmakingService(db);
const rating = new RatingService(db);
const rooms = new RoomService(db);

await registerRoutes(app, { auth, profile, matchmaking, rating, rooms });
await registerGameWebSocketRoutes(app, auth, rooms);

app.get("/", async() => ({ ok: true, name: "chess-backend-node" }));

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
