import assert from "../assert.js";
import CryptoService from "./crypto.js";
import { Database } from "./database.js";
import { Session, User, UserProfile } from "./usertypes.js";

export enum AuthError {
	INVALID_TOKEN = "INVALID_TOKEN",
	SESSION_EXPIRED = "SESSION_EXPIRED",
	SESSION_REVOKED = "SESSION_REVOKED",
	USER_NOT_FOUND = "USER_NOT_FOUND",
	ACCOUNT_DISABLED = "ACCOUNT_DISABLED",
	PROFILE_MISSING = "PROFILE_MISSING",
}

export type AuthResult = { valid: true; user: User; profile: UserProfile } | { valid: false; error: AuthError; user: null };

export class AuthService {
	constructor(private db: Database, private crypto: CryptoService) {}

	async signUp(input: {
		email: string;
		password: string;
		username: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}): Promise<{ user: User; profile: UserProfile; sessionToken: string }> {
		return this.db.transaction(async(trx) => {
			const email = input.email.trim().toLowerCase();
			const username = input.username.trim();
			assert(email && username && input.password.length >= 8, "Invalid signup input");
			assert(!(await this.db.query<{ id: string }>(
				"SELECT id FROM users WHERE email = ? LIMIT 1",
				[email]
			)).length, "Email already in use");
			const userId = crypto.randomUUID();
			const now = new Date().toISOString();
			await trx.execute(
				`INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
				 VALUES (?, ?, ?, true, ?, ?)`,
				[userId, email, await this.crypto.hashPassword(input.password), now, now]
			);
			await trx.execute(
				`INSERT INTO user_profiles
				 (user_id, username, avatar_url, rating, wins, losses, draws, created_at, updated_at)
				 VALUES (?, ?, NULL, 1000, 0, 0, 0, ?, ?)`,
				[userId, username, now, now]
			);
			const { sessionToken } = await this.createSession({
				userId,
				ipAddress: input.ipAddress ?? null,
				userAgent: input.userAgent ?? null,
			}, trx);
			const user = await this.getUserById(userId, trx);
			const profile = await this.getProfileByUserId(userId, trx);
			if (!user || !profile) throw new Error("Signup failed");
			return { user, profile, sessionToken };
		});
	}

	async login(input: {
		email: string;
		password: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}): Promise<{ user: User; profile: UserProfile; sessionToken: string }> {
		const user = (await this.db.query<User>(
			`SELECT id, email, password_hash AS passwordHash, is_active AS isActive,
			        created_at AS createdAt, updated_at AS updatedAt
			 FROM users WHERE email = ? LIMIT 1`,
			[input.email.trim().toLowerCase()]
		))[0];
		if (!user || !user.passwordHash) throw new Error("Invalid credentials");
		assert(user.isActive, "Account disabled");
		assert(await this.crypto.verifyPassword(input.password, user.passwordHash), "Invalid credentials");
		const { sessionToken } = await this.createSession({
			userId: user.id,
			ipAddress: input.ipAddress ?? null,
			userAgent: input.userAgent ?? null,
		});
		const profile = await this.getProfileByUserId(user.id);
		if (!profile) throw new Error("Profile missing");
		return { user, profile, sessionToken };
	}

	async logout(sessionToken: string): Promise<void> {
		await this.db.execute(
			`UPDATE sessions SET revoked_at = ? WHERE session_token_hash = ? AND revoked_at IS NULL`,
			[new Date().toISOString(), sessionToken]
		);
	}

	async authenticateSession(sessionToken: string): Promise<AuthResult> {
		const session = (await this.db.query<Session>(
			`SELECT id, user_id AS userId, session_token_hash AS sessionTokenHash,
			        created_at AS createdAt, expires_at AS expiresAt, revoked_at AS revokedAt,
			        ip_address AS ipAddress, user_agent AS userAgent
			 FROM sessions WHERE session_token_hash = ? LIMIT 1`,
			[sessionToken]
		))[0];
		if (!session) return { valid: false, error: AuthError.INVALID_TOKEN, user: null };
		if (session.revokedAt) return { valid: false, error: AuthError.SESSION_REVOKED, user: null };
		if (new Date(session.expiresAt).getTime() < Date.now()) return { valid: false, error: AuthError.SESSION_EXPIRED, user: null};
		const user = await this.getUserById(session.userId);
		if (!user) return { valid: false, error: AuthError.USER_NOT_FOUND, user: null };
		if (!user.isActive) return { valid: false, error: AuthError.ACCOUNT_DISABLED, user: null };
		const profile = await this.getProfileByUserId(user.id);
		if (!profile) return { valid: false, error: AuthError.PROFILE_MISSING, user: null };
		return { valid: true, user, profile };
	}

	private async createSession(input: {
		userId: string;
		ipAddress: string | null;
		userAgent: string | null;
	}, db: Database = this.db): Promise<{ sessionToken: string }> {
		const sessionToken = this.crypto.generateToken();
		await db.execute(
			`INSERT INTO sessions
			 (id, user_id, session_token_hash, created_at, expires_at, revoked_at, ip_address, user_agent)
			 VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
			[crypto.randomUUID(), input.userId, sessionToken, new Date().toISOString(), new Date(Date.now() + 2592000000).toISOString(), input.ipAddress, input.userAgent]
		);
		return { sessionToken };
	}

	private async getUserById(userId: string, db: Database = this.db): Promise<User | null> {
		return (await db.query<User>(
			`SELECT id, email, password_hash AS passwordHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
			 FROM users WHERE id = ? LIMIT 1`,
			[userId]
		))[0] ?? null;
	}

	private async getProfileByUserId(userId: string, db: Database = this.db): Promise<UserProfile | null> {
		return (await db.query<UserProfile>(
			`SELECT user_id AS userId, username, avatar_url AS avatarUrl, rating, wins, losses, draws,
			        created_at AS createdAt, updated_at AS updatedAt
			 FROM user_profiles WHERE user_id = ? LIMIT 1`,
			[userId]
		))[0] ?? null;
	}
}
