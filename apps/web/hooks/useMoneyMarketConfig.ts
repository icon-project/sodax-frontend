import type { MoneyMarketConfig } from '@new-world/sdk';

const moneyMarketConfig: MoneyMarketConfig = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
};

export function useMoneyMarketConfig() {
  return moneyMarketConfig;
}
