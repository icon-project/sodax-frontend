import type { XAccount } from '@/types';
import { XConnector } from '@/core';
import { connect, disconnect } from '@stacks/connect';

export class StacksXConnector extends XConnector {
  constructor() {
    super('STACKS', 'Stacks Wallet', 'stacks-wallet');
  }

  async connect(): Promise<XAccount | undefined> {
    const response = await connect();

    // @ts-ignore
    const stxAddress = response.addresses.find(a => a.purpose === 'stacks');
    if (!stxAddress) {
      return undefined;
    }

    return {
      address: stxAddress.address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    disconnect();
  }

  public get icon(): string | undefined {
    return undefined;
  }
}
