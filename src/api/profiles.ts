import { hash, randomHex } from '../utils.js';
import { getDB, type Access, type KeyValue } from './common.js';

export const uniqueProfileAttributes = ['id', 'name', 'email', 'token', 'session'];

export const profileAttributes = [...uniqueProfileAttributes, 'type', 'lastchange', 'created', 'is_disabled'];

/**
 * The profile's level of access and status
 */
export enum ProfileType {
	/**
	 * Standard profiles
	 */
	PROFILE = 0,

	DEVELOPER = 1,

	ADMIN = 2,
}

/**
 * The result object of a response representing an profile
 * @see Profile
 */
export interface ProfileResult {
	id: string;
	name: string;
	email: string;
	type: ProfileType;
	lastchange: string;
	created: string;
	is_disabled: boolean;
	token?: string;
	settings: string;
}

/**
 * The result object of a response representing an profile with all data
 * @see FullProfile
 */
export interface FullProfileResult extends ProfileResult {
	email: string;
	token: string;
	settings: string;
}

export interface ProfileSettings {}

/**
 * Represents an profile
 */
export interface Profile {
	/**
	 * The ID of the profile
	 */
	id: string;

	/**
	 * The name of the individual or entity who owns the profile
	 */
	name: string;

	/**
	 * The email of the profile
	 */
	email?: string;

	/**
	 * The type of the profile
	 */
	type: ProfileType;

	/**
	 * The last time the profile's name was changed
	 */
	lastchange: Date;

	/**
	 * When the profile was created
	 */
	created: Date;

	/**
	 * If the profile is currently disabled
	 */
	is_disabled: boolean;

	/**
	 * The login token of the profile
	 */
	token?: string;

	/**
	 * The profile's password hash.
	 *
	 * This is ***never*** sent by the server, it is only here for code convenience when updating the password.
	 */
	password?: string;

	/**
	 * Stored as JSON
	 */
	settings: ProfileSettings;
}

/**
 * Represents an profile with all data (i.e. sensitive information must be included)
 */
export interface FullProfile extends Profile {
	email: string;
	token: string;
	password?: string;
}

export type UniqueProfileKey = 'id' | 'email' | 'name' | 'token' | 'session';

/**
 * The roles of profile types
 */
export const profileRoles: { [key in ProfileType]: string } & string[] = ['User', 'Moderator', 'Developer', 'Administrator', 'Owner'];

/**
 * Gets a string describing the role of the profile type
 * @param type the profile type
 * @param short whether to use the short form or not
 * @returns the role
 */
export function getProfileRole(type: ProfileType, short?: boolean): string {
	if (typeof profileRoles[type] != 'string') {
		return 'Unknown' + (short ? '' : ` (${type})`);
	}
	if (!short) {
		return profileRoles[type];
	}
	switch (type) {
		case ProfileType.DEVELOPER:
			return 'Dev';
		case ProfileType.ADMIN:
			return 'Admin';
		default:
			return profileRoles[type];
	}
}

/**
 * Strips private information (e.g. email, password hash, etc.) from an profile
 * @param profile the profile to strip info from
 * @returns a new object without the stripped info
 */
export function stripProfileInfo(profile: Profile, access: Access = 'public'): Profile {
	const info = {
		id: profile.id,
		name: profile.name,
		type: profile.type,
		lastchange: profile.lastchange,
		created: profile.created,
		is_disabled: profile.is_disabled,
		settings: profile.settings,
	};
	if (access == 'public') {
		return info;
	}
	Object.assign(info, {
		email: profile.email,
		token: profile.token,
	});
	if (access == 'protected' || access == 'private') {
		return info;
	}

	// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
	throw new Error('Invalid access level: ' + access);
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 */
export function checkProfileAttribute<K extends keyof FullProfile>(key: K, value: FullProfile[K]): void {
	const [_key, _value] = [key, value] as Exclude<KeyValue<FullProfile>, undefined>;
	switch (_key) {
		case 'id':
			if (_value.length != 32) throw new Error('Invalid ID length');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid ID');
			break;
		case 'type':
			if (typeof _value != 'number') throw new TypeError('Profile type is not a number');
			if (_value < ProfileType.PROFILE || _value > ProfileType.ADMIN) throw new RangeError('Profile type is not valid');
			break;
		case 'email':
			if (!/^[\w.-]+@[\w-]+(\.\w{2,})+$/.test(_value)) throw new Error('Invalid email');
			break;
		case 'lastchange':
		case 'created':
			if (_value.getTime() > Date.now()) {
				throw new Error('Date is in the future');
			}
			break;
		case 'token':
			if (_value.length != 64) throw new Error('Invalid token or session');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid token or session');
			break;
		case 'is_disabled':
			if (![true, false, 1, 0, 'true', 'false'].some(v => v === _value)) throw new Error('Invalid disabled value');
			break;
		case 'password':
			break;
		default:
			throw new TypeError(`"${key}" is not an profile attribute`);
	}
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 * @returns whether the value is valid
 */
export function isValidProfileAttribute<K extends keyof FullProfile>(key: K, value: FullProfile[K]): boolean {
	try {
		checkProfileAttribute(key, value);
		return true;
	} catch (e) {
		return false;
	}
}

export async function getProfileNum(): Promise<number> {
	return (await getDB().prepare('select count(1) as num from profiles').first<number>('num'))!;
}

export async function getProfile(attr: string, value: string): Promise<FullProfile> {
	const result = await getProfiles(attr, value, 0, 1);
	return result[0];
}

export async function getProfiles(attr: string, value: string, offset = 0, limit = 1000): Promise<FullProfile[]> {
	if (!value) {
		return [];
	}
	const { results } = await getDB().prepare(`select * from profiles where ${attr}=? limit ?,?`).bind(value, offset, limit).all<FullProfile>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function getAllProfiles(offset = 0, limit = 1000): Promise<FullProfile[]> {
	const { results } = await getDB().prepare('select * from profiles limit ?,?').bind(offset, limit).all<FullProfile>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function getAllProfilesWithMinType(type: ProfileType = 2, offset = 0, limit = 1000): Promise<FullProfile[]> {
	const { results } = await getDB().prepare('select * from profiles where type >= ? limit ?,?').bind(type, offset, limit).all<FullProfile>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function setProfileAttribute(id: string, attr: string, value: string, reason?: string): Promise<void> {
	if (!isValidProfileAttribute(attr as keyof FullProfile, value)) {
		throw 'Invalid key or value';
	}

	const user = await getProfile('id', id);
	if (!user) {
		return;
	}
	const date = new Date(Date.now());
	switch (attr) {
		case 'name':
			await sendMailToUser(user, 'Name changed', 'Your name has been changed. If this was not you, you should change your password and contact support@blankstorm.net.');
			await getDB().prepare('update profiles set lastchange=?,name=? where id=?').bind(date, value, id).all();
			break;
		case 'password':
			await sendMailToUser(
				user,
				'Password changed',
				'Your password has been changed. If this was not you, you should change your password and contact support@blankstorm.net.'
			);
			await getDB().prepare('update profiles set password=? where id=?').bind(hash(value), id).run();
			break;
		case 'disabled':
			await sendMailToUser(
				user,
				'Profile ' + (value ? 'disabled' : 'enabled'),
				`Your profile has been ${value ? 'disabled' : 'enabled'}.\nReason: ${reason || '<em>no reason provided</em>'}`
			);
			break;
		case 'email':
			await sendMailToUser(
				user,
				'Email changed',
				`Your email has been changed to ${value}. If this was not you, you should change your password and contact support@blankstorm.net.`
			);
			break;
	}

	await getDB().prepare(`update profiles set ${attr}=? where id=?`).bind(value, id).run();
	return;
}

export async function profileExists(id: string): Promise<boolean> {
	const { results } = await getDB().prepare('select count(1) as num from profiles where id=?').bind(id).all<{ num: number }>();
	return !!results[0].num;
}

export async function deleteProfile(id: string, reason?: string): Promise<FullProfile> {
	if (!(await profileExists(id))) {
		throw new ReferenceError('User does not exist');
	}

	const user = await getProfile('id', id);
	await sendMailToUser(
		user,
		'Profile deleted',
		`Your profile has been deleted.
		Reason: ${reason || '<em>no reason provided</em>'}
		If you have any concerns please reach out to support@blankstorm.net.`
	);

	return (await getDB().prepare('delete from profiles where id=?').bind(id).first())!;
}

export async function login(id: string): Promise<string> {
	const token = randomHex(64);
	await getDB().prepare('update profiles set token=? where id=?').bind(token, id).first();
	return token;
}

export async function logout(id: string, reason?: string): Promise<boolean> {
	return (await getDB().prepare('update profiles set token="" where id=?').bind(id).first())!;
}

export async function createProfile(email: string, name: string, rawPassword: string): Promise<Profile> {
	checkProfileAttribute('email', email);
	checkProfileAttribute('password', rawPassword);

	if ((await getProfiles('email', email)).length) {
		throw new ReferenceError('User with email already exists');
	}

	const id = randomHex(32);
	const password = hash(rawPassword);
	const date = new Date(Date.now());

	if ((await getProfiles('id', id)).length) {
		throw new ReferenceError('User with id already exists');
	}

	await getDB().prepare('insert into profiles (id,name,email,password,type) values (?,?,?,?,0)').bind(id, name, email, password).all();

	return {
		id,
		is_disabled: false,
		name,
		email,
		type: 0,
		created: date,
		lastchange: date,
		settings: {},
	};
}

export async function sendMail(to: string, subject: string, contents: string) {
	await fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + process.env.sendgrid_api_key,
		},
		body: JSON.stringify({
			from: 'Journey <no-reply@blankstorm.net>',
			to,
			subject,
			html: '<p style="font-family:sans-serif">' + contents.replaceAll('\n', '<br>') + '</p>',
		}),
	});
}

export function sendMailToUser({ name, email }: { name: string; email?: string }, subject: string, contents: string) {
	if (!email) {
		throw 'Missing email';
	}
	return sendMail(`${name} <${email}>`, subject, `${name},\n\n${contents}\n\nBest,\nThe Journey dev team`);
}
