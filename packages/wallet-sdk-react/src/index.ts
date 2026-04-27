export * from './actions/index.js';
export * from './context/index.js';
export * from './core/index.js';

export * from './utils/index.js';

export * from './hooks/index.js';
export * from './useXWalletStore.js';
export * from './SodaxWalletProvider.js';

export * from './types/index.js';
export type { IXConnector, IXService } from './types/interfaces.js';

// ---------------------------------------------------------------------------
// Sub-path exports: concrete chain classes are NOT re-exported here.
// Consumers who need runtime access (e.g. `instanceof`) should use deep imports:
//   import { XverseXConnector } from '@sodax/wallet-sdk-react/xchains/bitcoin';
//
// Adding a new chain? Do NOT add `export * from './xchains/<chain>.js'` here.
// Instead, create `src/xchains/<chain>/index.ts` — tsup auto-discovers it.
// ---------------------------------------------------------------------------
