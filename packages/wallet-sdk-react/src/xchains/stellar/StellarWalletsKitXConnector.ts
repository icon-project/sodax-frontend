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

    if (!this._wallet.isAvailable) {
      // Throw instead of silently navigating to the install URL — callers
      // that bypass `useWalletModal.selectWallet`'s pre-check otherwise
      // see a tab open with no surfaced error. Consumers read
      // `connector.installUrl` to render the install CTA on the caught
      // error.
      throw new Error(`${this._wallet.name} is not installed. Install the wallet and reload the page.`);
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

  public override get isInstalled(): boolean {
    return this._wallet.isAvailable;
  }

  public override get installUrl(): string | undefined {
    return this._wallet.url;
  }
}
