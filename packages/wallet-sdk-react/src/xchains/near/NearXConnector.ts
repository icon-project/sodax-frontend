import type { XAccount } from '@/types';

import { XConnector } from '@/core';
import type { NearWalletBase } from '@hot-labs/near-connect';
import { NearXService } from './NearXService';

export class NearXConnector extends XConnector {
  _wallet: NearWalletBase;

  constructor(wallet: NearWalletBase) {
    super('NEAR', wallet.manifest.name, wallet.manifest.id);
    this._wallet = wallet;
  }

  getXService(): NearXService {
    return NearXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const walletSelector = this.getXService().walletSelector;
    const wallet = await walletSelector.connect(this._wallet.manifest.id);
    const accounts = await wallet.getAccounts();

    return {
      address: accounts[0].accountId,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    const walletSelector = this.getXService().walletSelector;
    await walletSelector.disconnect(this._wallet);
  }

  public get icon() {
    return this._wallet.manifest.icon;
  }
}
