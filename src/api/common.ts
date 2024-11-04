import type { D1Database } from '@cloudflare/workers-types';

export let db: D1Database;

export function setDB(value: D1Database) {
	db = value;
}

export function getDB(): D1Database {
	if (!db) {
		throw 'Could not access database';
	}
	return db;
}

/**
 * Access level for information
 */
export type Access = 'public' | 'protected' | 'private';

/**
 * { a: b, c: d } -> [a, b] | [c, d]
 */
export type KeyValue<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T];
