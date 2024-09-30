import type { AstroCookies, AstroGlobal } from 'astro';
import { createHash } from 'node:crypto';
import type { AccountType, Account } from './api.js';
import { getAccount } from './api.js';

export function hash(text: string): string {
	return createHash('sha256').update(text).digest('hex');
}

export async function currentUser(cookies: AstroCookies): Promise<Account | undefined> {
	if (!cookies.has('token')) {
		return;
	}
	const token = cookies.get('token')?.value;
	try {
		return await getAccount('token', token || '');
	} catch (e) {
		return;
	}
}

export async function parseBody<V extends Record<string, FormDataEntryValue>>(request: Request): Promise<V> {
	switch (request.headers.get('Content-Type')) {
		case 'application/json':
			return await request.json();
		case 'application/x-www-form-urlencoded':
			const formData = await request.formData();
			return Object.fromEntries(formData.entries()) as V;
		default:
			const text = await request.text();
			return JSON.parse(text);
	}
}

export function checkParams<B extends Record<string, unknown>>(body: B, ...params: (keyof B & string)[]): void {
	if (typeof body != 'object') {
		throw 'Invalid request body';
	}
	for (const param of params) {
		if (!(param in body)) {
			throw 'Missing in body: ' + param;
		}
	}
}

export async function checkAdminAuth(astro: Readonly<AstroGlobal>, minType?: AccountType): Promise<Account | Response> {
	const account = await currentUser(astro.cookies);

	minType ||= 1; // to prevent 0 from being passed

	if (!account) {
		return astro.redirect('/login');
	}

	if (account.type < minType) {
		astro.response.status = 403;
	}

	return account;
}
