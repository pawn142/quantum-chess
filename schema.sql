CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NULL,
	is_active BOOLEAN NOT NULL DEFAULT true,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
	user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	display_name TEXT NOT NULL UNIQUE,
	avatar_url TEXT NULL,
	rating INTEGER NOT NULL DEFAULT 1000,
	wins INTEGER NOT NULL DEFAULT 0,
	losses INTEGER NOT NULL DEFAULT 0,
	draws INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	session_token_hash TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	revoked_at TEXT NULL,
	ip_address TEXT NULL,
	user_agent TEXT NULL
);

CREATE TABLE IF NOT EXISTS match_requests (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	variant_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	UNIQUE(user_id, variant_id)
);

CREATE TABLE IF NOT EXISTS rooms (
	id TEXT PRIMARY KEY,
	variant_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open',
	white_user_id TEXT NULL,
	black_user_id TEXT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_members (
	room_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	role TEXT NOT NULL,
	joined_at TEXT NOT NULL,
	PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_events (
	id TEXT PRIMARY KEY,
	room_id TEXT NOT NULL,
	seq INTEGER NOT NULL,
	event_type TEXT NOT NULL,
	payload_json TEXT NOT NULL,
	created_at TEXT NOT NULL,
	UNIQUE(room_id, seq)
);

CREATE TABLE IF NOT EXISTS games (
	id TEXT PRIMARY KEY,
	room_id TEXT NOT NULL UNIQUE,
	white_user_id TEXT NOT NULL REFERENCES users(id),
	black_user_id TEXT NOT NULL REFERENCES users(id),
	variant_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	result TEXT NULL,
	created_at TEXT NOT NULL,
	finished_at TEXT NULL
);
