/* eslint-disable */

import sqlite3 from "sqlite3";

sqlite3.verbose();

export interface Database {
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	execute(sql: string, params?: unknown[]): Promise<void>;
}

export class SqliteDatabase implements Database {
	private db: sqlite3.Database;

	constructor(filename: string) {
		this.db = new sqlite3.Database(filename);
	}

	query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) return reject(err);
				resolve(rows as T[]);
			});
		});
	}

	execute(sql: string, params: unknown[] = []): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (err) {
				if (err) return reject(err);
				resolve();
			});
		});
	}
}

