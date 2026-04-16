import type { XAccount } from '@/types/index.js';

import { XConnector } from '@/core/index.js';
import { StellarXService } from './StellarXService.js';

export type StellarWalletType = {
  icon: string;
  id: string;
  isAvailable: boolean;
  name: string;
  type: string;
  url: string;
};

export class StellarWalletsKitXConnector extends XConnector {
  _wallet: StellarWalletType;

  constructor(wallet: StellarWalletType) {
    super('STELLAR', wallet.name, wallet.id);
    this._wallet = wallet;
  }

  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const kit = this.getXService().walletsKit;

    if (!this._wallet) {
      return;
    }

    if (!this._wallet.isAvailable && this._wallet.url) {
      window.open(this._wallet.url, '_blank');
      return;
    }

    kit.setWallet(this._wallet.id);
    const { address } = await kit.getAddress();

    return {
      address: address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public override get icon(): string {
    return this._wallet.icon;
  }
}
