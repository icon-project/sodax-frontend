// apps/web/constants/save.ts
// Save page types: network balances and deposit item data.

import type { XToken } from '@sodax/types';

export interface NetworkBalance {
  networkId: string;
  balance: string;
  token: XToken;
}

export interface DepositItemData {
  asset: XToken;
  totalBalance: string;
  fiatValue: string;
  networksWithFunds: NetworkBalance[];
  apy: string;
}
