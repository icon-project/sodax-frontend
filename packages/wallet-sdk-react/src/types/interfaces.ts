import type { ChainType, IXServiceBase } from '@sodax/types';
import type { XAccount } from './index.js';

/**
 * Public interface for chain service implementations.
 *
 * Consumer code should depend on this interface instead of the concrete XService class.
 * Extends the shared `IXServiceBase` from `@sodax/types` with wallet-sdk-react
 * specific connectc  connect(): Promise<XAccount | undefined>;
  disconnect(): Promise<void>;
}
