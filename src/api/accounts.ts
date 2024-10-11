import { randomHex } from '../utils.js';
import { getDB } from './common.js';

export type AccountType = 'savings' | 'checking';

export interface Account {
	/**
	 * Which user the account belongs to
	 */
	profile: string;

	/**
	 * The account ID.
	 */
	id: string;

	/**
	 * User-set name
	 */
	name: string;

	/**
	 *	The type of account
	 */
	type: AccountType;
}

export async function getProfileAccounts(id: string): Promise<Account[] | string> {
	const { results, success } = await getDB().prepare('select * from accounts where profile=?').bind(id).all<Account>();
	return success ? results : 'Could not get your accounts';
}

export function getAccount(id: string): Promise<Account | null> {
	return getDB().prepare('select * from accounts where id=?').bind(id).first();
}

export async function createAccount(profile: string, name: string, type: AccountType) {
	const id = randomHex(32);
	await getDB().prepare('insert into accounts (id,profile,name,type) values (?,?,?,?)').bind(id, profile, name, type).run();
}

export function isValidAccountType(type: string): type is AccountType {
	return ['savings', 'checking'].includes(type);
}
