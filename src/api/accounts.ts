import { getDB } from './common.js';

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
}

export async function getProfileAccounts(id: string): Promise<Account[] | string> {
	const { results, success } = await getDB().prepare('select * from accounts where profile=?').bind(id).all<Account>();
	return success ? results : 'Could not get your accounts';
}

export function getAccount(id: string): Promise<Account | null> {
	return getDB().prepare('select * from accounts where id=?').bind(id).first();
}
