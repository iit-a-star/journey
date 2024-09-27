import type { D1Database } from '@cloudflare/workers-types';
import { hash } from './utils.js';
//import { randomBytes } from 'node:crypto';

function randomHex(length: number): string {
	//return randomBytes(length).toString('hex');
	let bytes = '';
	for (let i = 0; i < length; i++) {
		bytes += Math.round(Math.random() * 16).toString(16);
	}
	return bytes;
}

let db: D1Database;

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
type KeyValue<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T];

export const uniqueAccountAttributes = ['id', 'username', 'email', 'token', 'session'];

export const accountAttributes = [...uniqueAccountAttributes, 'type', 'lastchange', 'created', 'is_disabled'];

/**
 * The account's level of access and status
 */
export enum AccountType {
	/**
	 * Standard accounts
	 */
	ACCOUNT = 0,

	DEVELOPER = 1,

	ADMIN = 2,
}

/**
 * The result object of a response representing an account
 * @see Account
 */
export interface AccountResult {
	id: string;
	name: string;
	email: string;
	type: AccountType;
	lastchange: string;
	created: string;
	is_disabled: boolean;
	token?: string;
	session?: string;
}

/**
 * The result object of a response representing an account with all data
 * @see FullAccount
 */
export interface FullAccountResult extends AccountResult {
	email: string;
	token: string;
	session: string;
}

/**
 * Represents an account
 */
export interface Account {
	/**
	 * The ID of the account
	 */
	id: string;

	/**
	 * The name of the individual or entity who owns the account
	 */
	name: string;

	/**
	 * The email of the account
	 */
	email?: string;

	/**
	 * The type of the account
	 */
	type: AccountType;

	/**
	 * The last time the account's username was changed
	 */
	lastchange: Date;

	/**
	 * When the account was created
	 */
	created: Date;

	/**
	 * If the account is currently disabled
	 */
	is_disabled: boolean;

	/**
	 * The login token of the account
	 */
	token?: string;

	/**
	 * The session token of the account
	 */
	session?: string;

	/**
	 * The account's password hash.
	 *
	 * This is ***never*** sent by the server, it is only here for code convience when updating the password.
	 */
	password?: string;
}

/**
 * Represents an account with all data (i.e. sensitive information must be included)
 */
export interface FullAccount extends Account {
	email: string;
	token: string;
	session: string;
	password?: string;
}

export type UniqueAccountKey = 'id' | 'email' | 'username' | 'token' | 'session';

/**
 * The roles of account types
 */
export const accountRoles: { [key in AccountType]: string } & string[] = ['User', 'Moderator', 'Developer', 'Administrator', 'Owner'];

/**
 * Gets a string describing the role of the account type
 * @param type the acccount type
 * @param short whether to use the short form or not
 * @returns the role
 */
export function getAccountRole(type: AccountType, short?: boolean): string {
	if (typeof accountRoles[type] != 'string') {
		return 'Unknown' + (short ? '' : ` (${type})`);
	}
	if (!short) {
		return accountRoles[type];
	}
	switch (type) {
		case AccountType.DEVELOPER:
			return 'Dev';
		case AccountType.ADMIN:
			return 'Admin';
		default:
			return accountRoles[type];
	}
}

/**
 * Strips private information (e.g. email, password hash, etc.) from an account
 * @param account the account to strip info from
 * @returns a new object without the stripped info
 */
export function stripAccountInfo(account: Account, access: Access = 'public'): Account {
	const info = {
		id: account.id,
		name: account.name,
		type: account.type,
		lastchange: account.lastchange,
		created: account.created,
		is_disabled: account.is_disabled,
	};
	if (access == 'public') {
		return info;
	}
	Object.assign(info, {
		email: account.email,
		token: account.token,
		session: account.session,
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
export function checkAccountAttribute<K extends keyof FullAccount>(key: K, value: FullAccount[K]): void {
	const [_key, _value] = [key, value] as Exclude<KeyValue<FullAccount>, undefined>;
	switch (_key) {
		case 'id':
			if (_value.length != 32) throw new Error('Invalid ID length');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid ID');
			break;
		case 'type':
			if (typeof _value != 'number') throw new TypeError('Account type is not a number');
			if (_value < AccountType.ACCOUNT || _value > AccountType.ADMIN) throw new RangeError('Account type is not valid');
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
		case 'session':
			if (_value.length != 64) throw new Error('Invalid token or session');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid token or session');
			break;
		case 'is_disabled':
			if (![true, false, 1, 0, 'true', 'false'].some(v => v === _value)) throw new Error('Invalid disabled value');
			break;
		case 'password':
			break;
		default:
			throw new TypeError(`"${key}" is not an account attribute`);
	}
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 * @returns whether the value is valid
 */
export function isValidAccountAttribute<K extends keyof FullAccount>(key: K, value: FullAccount[K]): boolean {
	try {
		checkAccountAttribute(key, value);
		return true;
	} catch (e) {
		return false;
	}
}

export async function getAccountNum(): Promise<number> {
	return (await getDB().prepare('select count(1) as num from accounts').first<number>('num'))!;
}

export async function getAccount(attr: string, value: string): Promise<FullAccount> {
	const result = await getAccounts(attr, value, 0, 1);
	return result[0];
}

export async function getAccounts(attr: string, value: string, offset = 0, limit = 1000): Promise<FullAccount[]> {
	if (!value) {
		return [];
	}
	const { results } = await getDB().prepare(`select * from accounts where ${attr}=? limit ?,?`).bind(value, offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function getAllAccounts(offset = 0, limit = 1000): Promise<FullAccount[]> {
	const { results } = await getDB().prepare('select * from accounts limit ?,?').bind(offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function getAllAccountsWithMinType(type: AccountType = 2, offset = 0, limit = 1000): Promise<FullAccount[]> {
	const { results } = await getDB().prepare('select * from accounts where type >= ? limit ?,?').bind(type, offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}

export async function setAccountAttribute(id: string, attr: string, value: string, reason?: string): Promise<void> {
	if (!isValidAccountAttribute(attr as keyof FullAccount, value)) {
		throw 'Invalid key or value';
	}

	const user = await getAccount('id', id);
	if (!user) {
		return;
	}
	const date = new Date(Date.now());
	switch (attr) {
		case 'username':
			await sendMailToUser(
				user,
				'Username changed',
				'Your username has been changed. If this was not you, you should change your password and contact support@blankstorm.net.'
			);
			await getDB().prepare('update accounts set lastchange=?,username=? where id=?').bind(date, value, id).all();
			break;
		case 'password':
			await sendMailToUser(
				user,
				'Password changed',
				'Your password has been changed. If this was not you, you should change your password and contact support@blankstorm.net.'
			);
			await getDB().prepare('update accounts set password=? where id=?').bind(hash(value), id).run();
			break;
		case 'disabled':
			await sendMailToUser(
				user,
				'Account ' + (value ? 'disabled' : 'enabled'),
				`Your account has been ${value ? 'disabled' : 'enabled'}.\nReason: ${reason || '<em>no reason provided</em>'}`
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

	await getDB().prepare(`update accounts set ${attr}=? where id=?`).bind(value, id).run();
	return;
}

export async function accountExists(id: string): Promise<boolean> {
	const { results } = await getDB().prepare('select count(1) as num from accounts where id=?').bind(id).all<{ num: number }>();
	return !!results[0].num;
}

export async function deleteAccount(id: string, reason?: string): Promise<FullAccount> {
	if (!(await accountExists(id))) {
		throw new ReferenceError('User does not exist');
	}

	const user = await getAccount('id', id);
	await sendMailToUser(
		user,
		'Account deleted',
		`Your account has been deleted.
		Reason: ${reason || '<em>no reason provided</em>'}
		If you have any concerns please reach out to support@blankstorm.net.`
	);

	return (await getDB().prepare('delete from accounts where id=?').bind(id).first())!;
}

export async function login(id: string): Promise<string> {
	const token = randomHex(32);
	await getDB().prepare('update accounts set token=? where id=?').bind(token, id).first();
	return token;
}

export async function logout(id: string, reason?: string): Promise<boolean> {
	return (await getDB().prepare('update accounts set token="" where id=?').bind(id).first())!;
}

export async function createAccount(name: string, email: string, rawPassword: string): Promise<Account> {
	checkAccountAttribute('email', email);
	checkAccountAttribute('password', rawPassword);

	if ((await getAccounts('email', email)).length) {
		throw new ReferenceError('User with email already exists');
	}

	const id = randomHex(16);
	const password = hash(rawPassword);
	const date = new Date(Date.now());

	if ((await getAccounts('id', id)).length) {
		throw new ReferenceError('User with id already exists');
	}

	await getDB().prepare('insert into accounts (id,username,email,password,type) values (?,?,?,?,0)').bind(id, name, email, password).all();

	await sendMailToUser(
		{ name, email },
		'Welcome to Blankstorm',
		`Thank you for joining Blankstorm! The game is still in development, so not all the features are completly finished.`
	);

	return {
		id,
		is_disabled: false,
		name,
		email,
		type: 0,
		created: date,
		lastchange: date,
	};
}

export async function sendMail(to: string, subject: string, contents: string) {
	await fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + process.env.sendgrid_api_key,
		},
		body: JSON.stringify({
			from: 'Blankstorm <no-reply@blankstorm.net>',
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
