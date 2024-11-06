import type { AstroCookies, AstroGlobal } from 'astro';
import { createHash, randomBytes } from 'node:crypto';
import type { Profile, ProfileType } from './api/profiles.js';
import { getProfile } from './api/profiles.js';

export function hash(text: string): string {
	return createHash('sha256').update(text).digest('hex');
}

/**
 * Converts a string into a color
 */
export function textToColor(text: string) {
	// Create a simple hash from the input string
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		hash = text.charCodeAt(i) + ((hash << 5) - hash);
	}

	// Convert the hash to an RGB color
	const r = (hash >> 0) & 0xff;
	const g = (hash >> 8) & 0xff;
	const b = (hash >> 16) & 0xff;

	// Format the RGB color as a hex string
	return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function randomHex(length: number): string {
	return randomBytes(length / 2).toString('hex');
}

export async function currentUser(cookies: AstroCookies): Promise<Profile | undefined> {
	if (!cookies.has('token')) {
		return;
	}
	const token = cookies.get('token')?.value;
	try {
		return await getProfile('token', token || '');
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

export async function checkAdminAuth(astro: Readonly<AstroGlobal>, minType?: ProfileType): Promise<Profile | Response> {
	const profile = await currentUser(astro.cookies);

	minType ||= 1; // to prevent 0 from being passed

	if (!profile) {
		return astro.redirect('/login');
	}

	if (profile.type < minType) {
		astro.response.status = 403;
	}

	return profile;
}
