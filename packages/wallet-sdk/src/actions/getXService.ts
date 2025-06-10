import type { XChainType } from '@/types';

import { ArchwayXService, HavahXService, IconXService, InjectiveXService, SolanaXService, StellarXService } from '..';
import { SuiXService } from '..';
import { EvmXService } from '..';
import type { XService } from '../core';

export function getXService(xChainType: XChainType): XService {
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
    case 'ARCHWAY':
      return ArchwayXService.getInstance();
    case 'HAVAH':
      return HavahXService.getInstance();
    case 'STELLAR':
      return StellarXService.getInstance();
  }
}
