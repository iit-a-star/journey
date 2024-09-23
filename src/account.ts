import type { Transaction } from './transaction.js';

export const transactions: Transaction[] = [];

export class Account {
	public get balance(): number {
		return transactions.reduce((total, tx) => total + (tx.to == this.id ? tx.amount : -tx.amount), 0);
	}

	public constructor(public readonly id: bigint) {}
}
