// apps/demo/src/components/mm/constants.ts
// Money Market UI constants - centralized location for easy maintenance

/**
 * Minimum borrow amount in USD equivalent.
 * Users must borrow at least this amount to ensure transactions are economically viable
 * and to prevent dust amounts that could cause issues.
 */
export const MIN_BORROW_USD = 1;

/**
 * Dust threshold for token amounts.
 * Amounts below this threshold are considered "dust" and buttons should be disabled.
 * Used to prevent enabling actions for very small amounts that display as "0.0000".
 */
export const DUST_THRESHOLD = 0.00001;

/**
 * Safety margin applied to max borrow calculations.
 * Reduces the maximum borrowable amount by 1% to account for price fluctuations
 * and prevent users from borrowing exactly at their limit.
 */
export const MAX_BORROW_SAFETY_MARGIN = 0.99;

/**
 * Timeout in milliseconds for copy-to-clipboard feedback.
 * After copying, the UI shows a checkmark for this duration before reverting.
 */
export const COPY_FEEDBACK_TIMEOUT_MS = 2000;

/**
 * Standard decimals for aTokens in the money market protocol.
 * All aTokens use 18 decimals regardless of the underlying token's decimals.
 */
export const ATOKEN_DECIMALS = 18;

/**
 * Ethereum zero address used for validation checks.
 * Used to check if an aToken address is valid (not zero address).
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Number of characters to show at the start and end of transaction hash for display.
 * Format: "0x1234...5678"
 */
export const TX_HASH_DISPLAY_LENGTH = 5;

/**
 * Minimum safe health factor threshold.
 * Health factors below this value indicate the account is at risk of liquidation.
 */
export const MIN_SAFE_HEALTH_FACTOR = 1;
