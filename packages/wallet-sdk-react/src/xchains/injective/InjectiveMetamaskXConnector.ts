import type { XAccount } from '@/types';

import { XConnector } from '@/core';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import { isEvmBrowserWallet, Wallet } from '@injectivelabs/wallet-base';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveMetamaskXConnector extends XConnector {
  constructor() {
    super('INJECTIVE', 'MetaMask', Wallet.Metamask);
  }

  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    if (!isEvmBrowserWallet(Wallet.Metamask)) {
      window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en', '_blank');
      return;
    }

    this.getXService().walletStrategy.setWallet(Wallet.Metamask);
    const addresses = await this.getXService().walletStrategy.getAddresses();
    const injectiveAddresses = addresses.map(getInjectiveAddress);

    return {
      address: injectiveAddresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    await this.getXService().walletStrategy.disconnect();
  }

  public get icon() {
    return 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/metamask.svg';
  }
}
