import type { ChainType } from '@sodax/types';

import { IconXService, InjectiveXService, SolanaXService, StellarXService } from '..';
import { SuiXService } from '..';
import { EvmXService } from '..';
import type { XService } from '../core';
import { NearXService } from '../xchains/near/NearXService';

export function getXService(xChainType: ChainType): XService {
  switch (xChainType) {
    case 'EVM':
      return EvmXService.getInstance();
    case 'SUI':
      return SuiXService.getInstance();
    case 'SOLANA':
      return SolanaXService.getInstance();
    case 'ICON':
      return IconXService.getInstance();
    case 'INJECTIVE':
      return InjectiveXService.getInstance();
    case 'STELLAR':
      return StellarXService.getInstance();
    case 'NEAR':
      return NearXService.getInstance();
    default:
      throw new Error(`Unsupported chain type: ${xChainType}`);
  }
}
