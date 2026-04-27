// // apps/demo/src/components/mm/constants.ts
// // Money Market UI constants - centralized location for easy maintenance
//
// /**
//  * Minimum borrow amount in USD equivalent.
//  * Users must borrow at least this amount to ensure transactions are economically viable
//  * and to prevent dust amounts that could cause issues.
//  */
// export const MIN_BORROW_USD = 1;
//
// /**
//  * Dust threshold for token amounts.
//  * Amounts below this threshold are considered "dust" and buttons should be disabled.
//  * Used to prevent enabling actions for very small amounts that display as "0.0000".
//  */
// export const DUST_THRESHOLD = 0.00001;
//
// /**
//  * Safety margin applied to max borrow calculations.
//  * Reduces the maximum borrowable amount by 1% to account for price fluctuations
//  * and prevent users from borrowing exactly at their limit.
//  */
// export const MAX_BORROW_SAFETY_MARGIN = 0.99;
//
// /**
//  * Timeout in milliseconds for copy-to-clipboard feedback.
//  * After copying, the UI shows a checkmark for this duration before reverting.
//  */
// export const COPY_FEEDBACK_TIMEOUT_MS = 2000;
//
// /**
//  * Standard decimals for aTokens in the money market protocol.
//  * All aTokens use 18 decimals regardless of the underlying token's decimals.
//  */
// export const ATOKEN_DECIMALS = 18;
//
// /**
//  * Ethereum zero address used for validation checks.
//  * Used to check if an aToken address is valid (not zero address).
//  */
// export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
//
// /**
//  * Number of characters to show at the start and end of transaction hash for display.
//  * Format: "0x1234...5678"
//  */
// export const TX_HASH_DISPLAY_LENGTH = 5;
//
// /**
//  * Minimum safe health factor threshold.
//  * Health factors below this value indicate the account is at risk of liquidation.
//  */
// export const MIN_SAFE_HEALTH_FACTOR = 1;
//
// /**
//  * Safety margin applied to max withdrawal calculations.
//  * Reduces the maximum withdrawable amount by 1% to prevent rounding/dust
//  * issues that could cause "exceeds balance" reverts on-chain.
//  */
// export const MAX_WITHDRAW_SAFETY_MARGIN = 0.99;
//
// /**
//  * Threshold for detecting whether a withdrawal is limited by health factor.
//  * If maxWithdraw < fullBalance × this value, the HF formula actually constrained
//  * the withdrawal (not just the safety margin alone).
//  */
// export const HF_LIMITED_THRESHOLD = 0.98;
//
// /**
//  * Default number of decimal places for displaying token amounts (e.g. borrow, repay, liquidity).
//  */
// export const AMOUNT_DISPLAY_DECIMALS = 6;
//
// /**
//  * Number of decimal places for displaying aToken (supply) balances.
//  */
// export const BALANCE_DISPLAY_DECIMALS = 5;
//
// /**
//  * Aave V3 index precision factor (1e27).
//  * Scaled balances and debt are stored on-chain divided by this factor.
//  * To get the actual amount: scaledBalance × liquidityIndex / AAVE_INDEX_PRECISION.
//  */
// export const AAVE_INDEX_PRECISION = BigInt('1000000000000000000000000000');
//
// /**
//  * Delay in milliseconds before the first deferred refetch after a money market transaction.
//  * Gives chains time to confirm the transaction before re-querying balances.
//  */
// export const POST_TX_REFETCH_DELAY = 2_000;
//
// /**
//  * Longer delay in milliseconds for a second deferred refetch after a money market transaction.
//  * Covers slower chains that need more time for on-chain state to update.
//  */
// export const POST_TX_REFETCH_DELAY_LONG = 5_000;
