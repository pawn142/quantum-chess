import assert from "../assert.js";
import { Database } from "./database.js";
import { UserProfile } from "./usertypes.js";

export default class ProfileService {
	// eslint-disable-next-line no-unused-vars
	constructor(private db: Database) {}

	async getPublicProfile(userId: string): Promise<UserProfile | null> {
		return (await this.db.query<UserProfile>(
			`SELECT user_id AS userId, username, avatar_url AS avatarUrl, rating, wins, losses, draws,
			        created_at AS createdAt, updated_at AS updatedAt
			 FROM user_profiles WHERE user_id = ? LIMIT 1`,
			[userId]
		))[0] ?? null;
	}

	async updateMyProfile(userId: string, input: {
		username?: string;
		avatarUrl?: string | null;
	}): Promise<UserProfile> {
		const updates: string[] = [];
		const values: unknown[] = [];
		if (input.username !== undefined) {
			updates.push("username = ?");
			values.push(input.username.trim());
		}
		if (input.avatarUrl !== undefined) {
			updates.push("avatar_url = ?");
			values.push(input.avatarUrl);
		}
		if (updates.length > 0) {
			updates.push("updated_at = ?");
			values.push(new Date().toISOString(), userId);
			await this.db.execute(`UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`, values);
		}
		const profile = await this.getPublicProfile(userId);
		assert(profile, "Profile not found");
		return profile!;
	}
}
