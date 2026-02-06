import { spokeChainConfig } from '@sodax/types';
import type { XToken } from '@sodax/types';

export function getUsdcDestinations(): XToken[] {
  return Object.values(spokeChainConfig)
    .flatMap(chain => Object.values(chain.supportedTokens ?? {}))
    .filter((token): token is XToken => token.symbol === 'USDC');
}
