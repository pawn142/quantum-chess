/* eslint-disable no-unused-vars */
/* eslint-disable space-before-function-paren */
// @ts-nocheck

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyWebsocket from '@fastify/websocket';
import fastifyCookie from '@fastify/cookie';

import type AuthService from "./auth.js";
import type RoomService from "./room.js";

export async function registerGameWebSocketRoutes(app: FastifyInstance, auth: AuthService, roomService: RoomService): Promise<void> {
	app.get("/games/:roomId/ws", { websocket: true }, async (socket, req) => {
		const request = req as FastifyRequest<{ Params: { roomId: string } }>;
		const roomId = request.params.roomId;
		const session = await authenticateFromCookies(request, auth);
		if (!session) {
			socket.close();
			return;
		}
		socket.send(JSON.stringify({
			type: "connected",
			roomId,
			userId: session.user.id,
			username: session.profile.username,
		}));
		socket.on("message", async (raw: any) => {
			const text = typeof raw === "string" ? raw : raw.toString("utf8");
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}
			const msg = parsed as { type?: string; move?: string };
			if (msg.type === "move" && typeof msg.move === "string") {
				await roomService.submitMove({ roomId, userId: session.user.id, move: msg.move });
				socket.send(JSON.stringify({ type: "ack", ok: true }));
				return;
			}
			socket.send(JSON.stringify({ type: "error", message: "Unsupported message" }));
		});
	});
}

async function authenticateFromCookies(request: FastifyRequest, auth: AuthService): Promise<{ user: { id: string }; profile: { username: string } } | null> {
	const token = request.cookies.session;
	if (!token) return null;
	return auth.authenticateSession(token);
}
