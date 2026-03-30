import type { XAccount } from '@/types';
import { XConnector } from '@/core';
import type { Wallet } from '@provablehq/aleo-wallet-adaptor-react';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { AleoXService } from './AleoXService.js';

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
    const adapter = this.wallet.adapter;
    if (!adapter) throw new Error('No adapter found for Aleo wallet');

    const account = await adapter.connect(
      'mainnet' as Parameters<typeof adapter.connect>[0],
      DecryptPermission.NoDecrypt,
      [],
    );

    return { address: account.address, xChainType: this.xChainType };
  }

  async disconnect(): Promise<void> {
    await this.wallet.adapter.disconnect();
  }

  public get icon() {
    return this.wallet.adapter.icon;
  }

  // Get the wallet's installation URL
  public get url() {
    return this.wallet.adapter.url;
  }
}
