/**
 * Token Picker ordering rules (product requirement).
 *
 * Order:
 * 1) Tokens where the user has any balance (across any chain)
 * 2) Group A: Top 6 assets (fixed order, hardcoded) can be changed when needed
 * 3) Group B: Runner-ups (fixed order, hardcoded) can be changed when needed
 * 4) Group C: everything else alphabetical
 *
 * Notes:
 * - Symbols must match the UI symbols (case-insensitive). Example: "AVAX.LL", "XLM.LL".
 * - These are "display symbols" (we intentionally do NOT merge AVAX vs AVAX.LL, etc).
 */
export const TOKEN_PICKER_GROUP_A = Object.freeze(['BTC', 'ETH', 'USDC', 'BNB', 'AVAX', 'POL']);

export const TOKEN_PICKER_GROUP_B = Object.freeze([
  'bnUSD',
  'wstETH',
  'weETH',
  'XLM.LL',
  'AVAX.LL',
  'BNB.LL',
  'BTC.LL',
  'BTCB',
]);

/**
 * Optional: set to true if product wants SODA always first.
 * If false, SODA is treated normally by the rules above.
 */
