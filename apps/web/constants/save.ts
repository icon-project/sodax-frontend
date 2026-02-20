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
