import { Database } from "./database.js";

export default class MatchmakingService {
	// eslint-disable-next-line no-unused-vars
	constructor(private db: Database) {}

	async joinQueue(input: { userId: string; variantId: string }): Promise<{ queued: true }> {
		await this.db.execute(
			`INSERT INTO match_requests (id, user_id, variant_id, created_at)
			 VALUES (?, ?, ?, ?)`,
			[crypto.randomUUID(), input.userId, input.variantId, new Date().toISOString()]
		);
		return { queued: true };
	}

	async leaveQueue(input: { userId: string; variantId: string }): Promise<void> {
		await this.db.execute(
			`DELETE FROM match_requests WHERE user_id = ? AND variant_id = ?`,
			[input.userId, input.variantId]
		);
	}

	async tryPair(variantId: string): Promise<{ whiteUserId: string; blackUserId: string } | null> {
		const rows = await this.db.query<{ userId: string }>(
			`SELECT user_id AS userId FROM match_requests WHERE variant_id = ? ORDER BY created_at ASC LIMIT 2`,
			[variantId]
		);
		if (rows.length < 2) return null;
		const [a, b] = rows;
		await this.db.execute(
			`DELETE FROM match_requests WHERE variant_id = ? AND user_id IN (?, ?)`,
			[variantId, a!.userId, b!.userId]
		);
		return { whiteUserId: a!.userId, blackUserId: b!.userId };
	}
}
