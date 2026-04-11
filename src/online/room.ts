import type { Database } from "./database.js";
import type { Room, RoomEvent } from "./usertypes.js";

export type Events = Array<{ id: string; roomId: string; seq: number; eventType: RoomEvent["eventType"]; payload: unknown; createdAt: string; }>;

export default class RoomService {
	constructor(private db: Database) {}

	async createRoom(input: { variantId: string; creatorId: string }): Promise<{ roomId: string }> {
		const roomId = crypto.randomUUID();
		const now = new Date().toISOString();
		await this.db.execute(
			`INSERT INTO rooms (id, variant_id, status, created_at, updated_at)
			 VALUES (?, ?, 'open', ?, ?)`,
			[roomId, input.variantId, now, now]
		);
		await this.db.execute(
			`INSERT INTO room_members (room_id, user_id, role, joined_at)
			 VALUES (?, ?, 'player', ?)`,
			[roomId, input.creatorId, now]
		);
		await this.appendEvent(roomId, "join", { userId: input.creatorId, role: "player" });
		return { roomId };
	}

	async joinRoom(input: { roomId: string; userId: string; role: "player" | "spectator" }): Promise<void> {
		await this.db.execute(
			`INSERT OR IGNORE INTO room_members (room_id, user_id, role, joined_at)
			 VALUES (?, ?, ?, ?)`,
			[input.roomId, input.userId, input.role, new Date().toISOString()]
		);
		await this.appendEvent(input.roomId, "join", { userId: input.userId, role: input.role });
	}

	async submitMove(input: { roomId: string; userId: string; move: string }): Promise<void> {
		await this.appendEvent(input.roomId, "move", { userId: input.userId, move: input.move });
	}

	async getState(roomId: string): Promise<{ room: Room, events: Events } | null> {
		const room = (await this.db.query<Room>(
			`SELECT id, variant_id AS variantId, status,
			        white_user_id AS whiteUserId, black_user_id AS blackUserId,
			        created_at AS createdAt, updated_at AS updatedAt
			 FROM rooms WHERE id = ? LIMIT 1`,
			[roomId]
		))[0];
		if (!room) return null;
		const events = await this.db.query<{ id: string; roomId: string; seq: number; eventType: RoomEvent["eventType"]; payloadJson: string; createdAt: string }>(
			`SELECT id, room_id AS roomId, seq, event_type AS eventType,
			        payload_json AS payloadJson,
			        created_at AS createdAt
			 FROM room_events WHERE room_id = ? ORDER BY seq ASC`,
			[roomId]
		);
		return { room, events: events.map((event) => ({
			id: event.id,
			roomId: event.roomId,
			seq: event.seq,
			eventType: event.eventType,
			payload: JSON.parse(event.payloadJson),
			createdAt: event.createdAt,
		}))};
	}

	async getEventsSince(roomId: string, sinceSeq: number): Promise<Events> {
		const rows = await this.db.query<{ id: string; roomId: string; seq: number; eventType: RoomEvent["eventType"]; payloadJson: string; createdAt: string }>(
			`SELECT id, room_id AS roomId, seq, event_type AS eventType,
			        payload_json AS payloadJson,
			        created_at AS createdAt
			 FROM room_events WHERE room_id = ? AND seq > ? ORDER BY seq ASC`,
			[roomId, sinceSeq]
		);
		return rows.map((event) => ({
			id: event.id,
			roomId: event.roomId,
			seq: event.seq,
			eventType: event.eventType,
			payload: JSON.parse(event.payloadJson),
			createdAt: event.createdAt,
		}));
	}
	
	private async appendEvent(roomId: string, eventType: RoomEvent["eventType"], payload: unknown): Promise<void> {
		await this.db.execute(
			`INSERT INTO room_events (id, room_id, seq, event_type, payload_json, created_at)
			 SELECT ?, ?, COALESCE(MAX(seq), 0) + 1, ?, ?, ?
			 FROM room_events WHERE room_id = ?`,
			[crypto.randomUUID(), roomId, eventType, JSON.stringify(payload), new Date().toISOString(), roomId]
		);
	}
}
