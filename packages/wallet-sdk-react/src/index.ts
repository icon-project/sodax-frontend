export * from './actions';
export * from './context';
export * from './core';

export * from './utils';

export * from './hooks';
export * from './useXWalletStore';
export * from './useXWagmiStore';
export * from './SodaxWalletProvider';

export * from './types';
export type * from './types';

// ---------------------------------------------------------------------------
// Sub-path exports: concrete chain classes are NOT re-exported here.
// Consumers who need runtime access (e.g. `instanceof`) should use deep imports:
//   import { XverseXConnector } from '@sodax/wallet-sdk-react/xchains/bitcoin';
//
// Adding a new chain? Do NOT add `export * from './xchains/<chain>'` here.
// Instead, create `src/xchains/<chain>/index.ts` — tsup auto-discovers it.
// ---------------------------------------------------------------------------
