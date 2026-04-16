import type { XAccount } from '@/types/index.js';

import { XConnector } from '@/core/index.js';
import type { NearWalletBase } from '@hot-labs/near-connect';
import { NearXService } from './NearXService.js';

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
    const wallet = await walletSelector.connect({ walletId: this._wallet.manifest.id });
    const accounts = await wallet.getAccounts();

    if (accounts.length === 0 || accounts[0] === undefined) {
      console.warn(`[NearXConnector] connect: ${this._wallet.manifest.name} returned no accounts`);
      return undefined;
    }

    return {
      address: accounts[0].accountId,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    const walletSelector = this.getXService().walletSelector;
    await walletSelector.disconnect(this._wallet);
  }

  public override get icon(): string {
    return this._wallet.manifest.icon;
  }
}
