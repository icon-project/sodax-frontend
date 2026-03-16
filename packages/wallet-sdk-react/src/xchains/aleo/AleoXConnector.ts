import type { XAccount } from '@/types';
import { XConnector } from '@/core';
import type { Wallet } from '@provablehq/aleo-wallet-adaptor-react';
import { AleoXService } from './AleoXService';

export class AleoXConnector extends XConnector {
  wallet: Wallet;

  constructor(wallet: Wallet) {
    super('ALEO', wallet.adapter.name, wallet.adapter.name);
    this.wallet = wallet;
  }

  getXService(): AleoXService {
    return AleoXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this.wallet.adapter.icon;
  }

  // Get the wallet's installation URL
  public get url() {
    return this.wallet.adapter.url;
  }
}