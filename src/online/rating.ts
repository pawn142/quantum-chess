import { Database } from "./database.js";

export default class RatingService {
	constructor(private db: Database) {}

	async recordGameResult(input: {
		whiteUserId: string;
		blackUserId: string;
		result: "white" | "black" | "draw";
	}): Promise<void> {
		await this.db.transaction(async(trx) => {
			const [whiteRating, blackRating] = await Promise.all([this.getRating(input.whiteUserId, trx), this.getRating(input.blackUserId, trx)]);
			const [newWhiteRating, newBlackRating] = eloAdjust(whiteRating, blackRating, input.result);
			const now = new Date().toISOString();
			await trx.execute(
				`UPDATE user_profiles SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ?, updated_at = ? WHERE user_id = ?`,
				[newWhiteRating, input.result === "white" ? 1 : 0, input.result === "black" ? 1 : 0, input.result === "draw" ? 1 : 0, now, input.whiteUserId]
			);
			await trx.execute(
				`UPDATE user_profiles SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ?, updated_at = ? WHERE user_id = ?`,
				[newBlackRating, input.result === "black" ? 1 : 0, input.result === "white" ? 1 : 0, input.result === "draw" ? 1 : 0, now, input.blackUserId]
			);
		});
	}

	private async getRating(userId: string, db: Database = this.db): Promise<number> {
		return (await db.query<{ rating: number }>(
			`SELECT rating FROM user_profiles WHERE user_id = ? LIMIT 1`,
			[userId]
		))[0]?.rating ?? 1000;
	}
}

function eloAdjust(whiteRating: number, blackRating: number, result: "white" | "black" | "draw"): [number, number] {
	const whiteExpected = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
	const blackExpected = 1 / (1 + Math.pow(10, (whiteRating - blackRating) / 400));
	const whiteScore = result === "white" ? 1 : result === "black" ? 0 : 0.5;
	return [Math.round(whiteRating + 16 * (whiteScore - whiteExpected)), Math.round(blackRating + 16 * (1 - whiteScore - blackExpected))];
}
