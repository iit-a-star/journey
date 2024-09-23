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
	 * Which account ID the transaction is from
	 */
	readonly amount: number;

	/**
	 * Optional comment on the transaction
	 */
	readonly memo?: string;
}
