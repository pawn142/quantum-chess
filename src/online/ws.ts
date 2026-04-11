import type { FastifyInstance, FastifyRequest } from "fastify";
import type { AuthService } from "./auth.js";
import type RoomService from "./room.js";

interface ConnectedClient {
	socket: WebSocket;
	userId: string;
	username: string;
}

const roomConnections = new Map<string, Set<ConnectedClient>>();

export async function registerGameWebSocketRoutes(app: FastifyInstance, auth: AuthService, roomService: RoomService): Promise<void> {
	app.get("/games/:roomId/ws", { websocket: true }, async(socket, req) => {
		const request = req as FastifyRequest<{ Params: { roomId: string } }>;
		const roomId = request.params.roomId;
		const session = await auth.authenticateSession(request.cookies.session!);
		if (!session.valid) {
			socket.close(1008, session.error || "Unauthorized");
			return;
		}
		const client: ConnectedClient = {
			socket,
			userId: session.user!.id,
			username: session.profile!.username,
		};
		if (!roomConnections.has(roomId)) {
			roomConnections.set(roomId, new Set());
		}
		roomConnections.get(roomId)!.add(client);
		const state = await roomService.getState(roomId);
		const lastSeq = state?.events.length ?? 0;
		socket.send(JSON.stringify({
			type: "connected",
			roomId,
			userId: client.userId,
			username: client.username,
			lastSeq,
		}));
		socket.on("message", async(raw: any) => {
			const text = raw.toString();
			let message: any;
			try {
				message = JSON.parse(text);
			} catch {
				socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
				return;
			}
			const since = Number(message.since) || 0;
			const events = await roomService.getEventsSince(roomId, since);
			switch (message.type) {
				case "move":
					if (typeof message.move !== "string") {
						socket.send(JSON.stringify({ type: "error", message: "Invalid move" }));
						return;
					}
					await roomService.submitMove({ roomId, userId: client.userId, move: message.move });
					broadcast(roomId, {
						type: "move",
						userId: client.userId,
						move: message.move,
						seq: await getCurrentSeq(roomId),
					});
					break;
				case "get_events_since":
					socket.send(JSON.stringify({ type: "events", events }));
					break;
				default:
					socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
			}
		});
	});
}

function broadcast(roomId: string, message: object) {
	const clients = roomConnections.get(roomId);
	if (!clients) return;
	const data = JSON.stringify(message);
	for (const client of clients) {
		client.socket.send(data);
	}
}

async function getCurrentSeq(__roomId: string): Promise<number> {
	return Date.now();
}
