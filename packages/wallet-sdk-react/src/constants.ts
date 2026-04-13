/**
 * Default values used across providers and hydrators.
 * Centralized so consumers and tests have a single source of truth.
 */

// ─── Stacks ─────────────────────────────────────────────────────────────────
export const STACKS_DEFAULT_RPC_URL = 'https://api.mainnet.hiro.so';
export const STACKS_DEFAULT_NETWORK = 'mainnet' as const;

// ─── Sui ────────────────────────────────────────────────────────────────────
export const SUI_DEFAULT_NETWORK = 'mainnet' as const;
export const SUI_DEFAULT_AUTO_CONNECT = true;

// ─── EVM ────────────────────────────────────────────────────────────────────
export const EVM_DEFAULT_RECONNECT_ON_MOUNT = false;
export const EVM_DEFAULT_SSR = true;

// ─── Solana ─────────────────────────────────────────────────────────────────
export const SOLANA_DEFAULT_AUTO_CONNECT = true;
export const SOLANA_DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';
/** Timeout for MetaMask Solana wallet connect — MetaMask's Solana adapter is slow to fire `connect`. */
export const SOLANA_METAMASK_CONNECT_TIMEOUT_MS = 30_000;

// ─── Bitcoin ────────────────────────────────────────────────────────────────
export const BITCOIN_DEFAULT_RPC_URL = 'https://mempool.space/api';

// ─── Stellar ────────────────────────────────────────────────────────────────
export const STELLAR_DEFAULT_HORIZON_RPC_URL = 'https://horizon.stellar.org';
export const STELLAR_DEFAULT_SOROBAN_RPC_URL = 'https://rpc.ankr.com/stellar_soroban';

// ─── NEAR ───────────────────────────────────────────────────────────────────
export const NEAR_DEFAULT_RPC_URL = 'https://1rpc.io/near';
