import type { Database } from "./online/database.js";

export async function runMigrations(db: Database): Promise<void> {
	await db.execute(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY,
			applied_at TEXT NOT NULL
		)
	`);
	const result = await db.query<{ version: number }>(
		"SELECT MAX(version) as version FROM schema_version"
	);
	const currentVersion = result[0]?.version ?? 0;
	const migrations: Array<{ version: number; up: string }> = [
		{ version: 1, up: `
			CREATE TABLE users (
				id TEXT PRIMARY KEY,
				email TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				is_active BOOLEAN DEFAULT 1,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE TABLE user_profiles (
				user_id TEXT PRIMARY KEY REFERENCES users(id),
				username TEXT UNIQUE NOT NULL,
				avatar_url TEXT,
				rating INTEGER DEFAULT 1000,
				wins INTEGER DEFAULT 0,
				losses INTEGER DEFAULT 0,
				draws INTEGER DEFAULT 0,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE TABLE sessions (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id),
				session_token_hash TEXT UNIQUE NOT NULL,
				created_at TEXT NOT NULL,
				expires_at TEXT NOT NULL,
				revoked_at TEXT,
				ip_address TEXT,
				user_agent TEXT
			);
		`},
		{ version: 2, up: `
			CREATE TABLE match_requests (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id),
				variant_id TEXT NOT NULL,
				created_at TEXT NOT NULL
			);
		`},
		{ version: 3, up: `
			CREATE TABLE rooms (
				id TEXT PRIMARY KEY,
				variant_id TEXT NOT NULL,
				status TEXT DEFAULT 'open',
				white_user_id TEXT REFERENCES users(id),
				black_user_id TEXT REFERENCES users(id),
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);
			CREATE TABLE room_members (
				room_id TEXT NOT NULL REFERENCES rooms(id),
				user_id TEXT NOT NULL REFERENCES users(id),
				role TEXT NOT NULL,
				joined_at TEXT NOT NULL,
				PRIMARY KEY (room_id, user_id)
			);
			CREATE TABLE room_events (
				id TEXT PRIMARY KEY,
				room_id TEXT NOT NULL REFERENCES rooms(id),
				seq INTEGER NOT NULL,
				event_type TEXT NOT NULL,
				payload_json TEXT NOT NULL,
				created_at TEXT NOT NULL,
				UNIQUE(room_id, seq)
			);
		`},
	];
	for (const migration of migrations) {
		if (migration.version > currentVersion) {
			await db.transaction(async(trx: any) => {
				for (const stmt of migration.up.split(";").filter(s => s.trim())) {
					await trx.execute(stmt);
				}
				await trx.execute(
					"INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
					[migration.version, new Date().toISOString()]
				);
			});
			console.log(`Applied migration ${migration.version}`);
		}
	}
}
