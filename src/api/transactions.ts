import { getDB } from './common.js';

export interface TransactionMetadata {
	category: string;
}

export interface Transaction {
	/**
	 * The transaction's ID
	 */
	readonly id: string;

	/**
	 * Which account ID the transaction is from
	 */
	readonly from: string;

	/**
	 * Which account ID the transaction is to
	 */
	readonly to: string;

	/**
	 * When the transaction happened
	 */
	readonly timestamp: number;

	/**
	 * How much the transaction is for
	 */
	readonly amount: number;

	/**
	 * Metadata about the transaction.
	 * Stored as JSON.
	 */
	readonly metadata: TransactionMetadata;

	/**
	 * Optional comment on the transaction
	 */
	readonly memo?: string;
}

export async function getTransactions(account: string): Promise<Transaction[] | null> {
	const { results } = await getDB().prepare('select * from transactions where "from"=? or "to"=?').bind(account, account).all<Transaction>();
	return results;
}

export function getTransaction(id: string): Promise<Transaction | null> {
	return getDB().prepare('select * from transactions where id=?').bind(id).first();
}
