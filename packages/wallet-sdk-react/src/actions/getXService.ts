import type { ChainType } from '@sodax/types';

import { BitcoinXService, IconXService, InjectiveXService, SolanaXService, StellarXService } from '..';
import { SuiXService } from '..';
import { EvmXService } from '..';
import type { XService } from '../core';
import { NearXService } from '../xchains/near/NearXService';
import { AleoXService } from '../xchains/aleo';
import { StacksXService } from '../xchains/stacks/StacksXService';

export function getXService(xChainType: ChainType): XService {
  switch (xChainType) {
    case 'BITCOIN':
      return BitcoinXService.getInstance();
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
    case 'ALEO':
      return AleoXService.getInstance();
    case 'STACKS':
      return StacksXService.getInstance();
    default:
      throw new Error(`Unsupported chain type: ${xChainType}`);
  }
}
