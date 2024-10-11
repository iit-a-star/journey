export interface TransactionMetadata {
	category: string;
}

export interface Transaction {
	/**
	 * The transaction's ID
	 */
	readonly id: bigint;

	/**
	 * Which account ID the transaction is from
	 */
	readonly from: bigint;

	/**
	 * Which account ID the transaction is to
	 */
	readonly to: bigint;

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
