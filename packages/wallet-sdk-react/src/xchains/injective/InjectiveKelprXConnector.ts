import type { XAccount } from '@/types';

import { XConnector } from '@/core';
import { Wallet } from '@injectivelabs/wallet-base';
import { isCosmosWalletInstalled } from '@injectivelabs/wallet-cosmos';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveKelprXConnector extends XConnector {
  constructor() {
    super('INJECTIVE', 'Keplr', Wallet.Keplr);
  }

  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    if (!isCosmosWalletInstalled(Wallet.Keplr)) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    this.getXService().walletStrategy.setWallet(Wallet.Keplr);
    const addresses = await this.getXService().walletStrategy.getAddresses();

    return {
      address: addresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/keplr.svg';
  }
}
