import { DatabaseSync, SQLInputValue } from "node:sqlite";

export interface Database {
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	execute(sql: string, params?: unknown[]): Promise<void>;
	transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
}

export class SqliteDatabase implements Database {
	private readonly db: DatabaseSync;

	constructor(filename: string = process.env.DATABASE_PATH ?? "./data.sqlite") {
		this.db = new DatabaseSync(filename);
		this.db.exec("PRAGMA foreign_keys = ON;");
		this.db.exec("PRAGMA journal_mode = WAL;");
	}

	async query<T = unknown>(sql: string, params: SQLInputValue[] = []): Promise<T[]> {
		return this.db.prepare(sql).all(...params) as T[];
	}

	async execute(sql: string, params: SQLInputValue[] = []): Promise<void> {
		this.db.prepare(sql).run(...params);
	}

	async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
		this.db.exec("BEGIN");
		try {
			const result = await fn(this);
			this.db.exec("COMMIT");
			return result;
		} catch (err) {
			this.db.exec("ROLLBACK");
			throw err;
		}
	}
}
