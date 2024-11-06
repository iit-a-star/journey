import { randomHex } from '../utils.js';
import { getDB } from './common.js';

export interface TransactionMetadata {
	category?: string;
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
	metadata: TransactionMetadata;

	/**
	 * Optional comment on the transaction
	 */
	readonly memo?: string;
}

export async function countTransactions(): Promise<number> {
	return (await getDB().prepare('select count(1) as num from transactions').first<number>('num'))!;
}

export async function getTransactions(account: string): Promise<Transaction[] | null> {
	const { results } = await getDB().prepare('select * from transactions where "from"=? or "to"=?').bind(account, account).all<Transaction>();
	return results.map(tx => ({
		...tx,
		metadata: JSON.parse(tx.metadata as string),
	}));
}

export async function getTransaction(id: string): Promise<Transaction | null> {
	const tx: Record<string, string> | null = await getDB().prepare('select * from transactions where id=?').bind(id).first();
	if (tx) tx.metadata = JSON.parse(tx.metadata);
	return tx as Transaction | null;
}

export async function addTransaction(from: string, to: string, amount: number, memo?: string): Promise<void> {
	const id = randomHex(32);
	await getDB().prepare('insert into transactions (id, "from", "to", amount, memo) values (?,?,?,?,?)').bind(id, from, to, amount, memo).run();
}

export async function updateTransactionMetadata(id: string, metadata: TransactionMetadata): Promise<void> {
	await getDB().prepare('update transactions set metadata=? where id=?').bind(JSON.stringify(metadata), id).run();
}

export function sumTransactions(transactions?: Transaction[] | null, id?: string) {
	if (!transactions) {
		return 0;
	}
	return transactions.reduce((total: number, tx: Transaction) => total + (tx.from == id ? -1 : 1) * tx.amount, 0);
}
