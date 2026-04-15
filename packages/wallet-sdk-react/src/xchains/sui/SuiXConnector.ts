import type { XAccount } from '@/types';

import { XConnector } from '@/core';
import { SuiXService } from './SuiXService';

// Structural interface for what we actually use from a Sui wallet.
// We don't import the nominal type from @mysten/wallet-standard because
// @mysten/dapp-kit may resolve a different version, causing nominal mismatch.
// Structural typing avoids this: as long as the object has these fields, it works.
interface SuiWalletInfo {
  name: string;
  icon?: string;
}

export class SuiXConnector extends XConnector {
  wallet: SuiWalletInfo;

  constructor(wallet: SuiWalletInfo) {
    // super('SUI', wallet.name, wallet.id);
    super('SUI', wallet?.name, wallet?.name);
    this.wallet = wallet;
  }

  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this.wallet?.icon;
  }
}
