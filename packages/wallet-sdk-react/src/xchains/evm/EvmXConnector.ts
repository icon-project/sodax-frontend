import { XConnector } from '@/core/XConnector';
import type { XAccount } from '@/types';
import type { Connector } from 'wagmi';

export class EvmXConnector extends XConnector {
  connector: Connector;

  constructor(connector: Connector) {
    super('EVM', connector.name, connector.id);
    this.connector = connector;
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {
    return;
  }

  public get id() {
    return this.connector.id;
  }
  public get icon() {
    if (!this.connector.icon && this.connector.type === 'walletConnect') {
      return 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/Blue%20(Default)/Icon.svg';
    }
    return this.connector.icon;
  }
}
