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

// ─── Wallet modal ──────────────────────────────────────────────────────────
/** Max wait for the Hydrator to populate `xConnections` after a provider-managed connect. */
export const WALLET_MODAL_HYDRATION_TIMEOUT_MS = 5_000;

// ─── Wallet metadata (install URLs + icons for extension-based wallets) ────
// Keys are wallet-level, not per-connector: one OKX extension serves both
// Bitcoin and EVM connectors, so metadata is shared.

export const WALLET_METADATA = {
  unisat: {
    installUrl: 'https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo',
    icon: 'https://avatars.githubusercontent.com/u/125119198?s=200&v=4',
  },
  xverse: {
    installUrl: 'https://chromewebstore.google.com/detail/xverse-bitcoin-crypto-wal/idnnbdplmphpflfnlkomgpfbpcgelopg',
    icon:
      'https://cdn.brandfetch.io/iddzGN5Rcv/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771902357797',
  },
  okx: {
    installUrl: 'https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
    icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
  },
  hana: {
    installUrl: 'https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl',
    icon: 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/hana.svg',
  },
} as const satisfies Record<string, { installUrl: string; icon: string }>;
