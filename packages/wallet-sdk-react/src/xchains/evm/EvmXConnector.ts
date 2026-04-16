import { XConnector } from '@/core/XConnector.js';
import type { XAccount } from '@/types/index.js';
import type { Connector } from 'wagmi';

const WALLETCONNECT_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='%233B99FC' d='M9.58 11.58c3.55-3.47 9.29-3.47 12.84 0l.43.42a.44.44 0 0 1 0 .63l-1.46 1.43a.23.23 0 0 1-.32 0l-.59-.57a6.72 6.72 0 0 0-9.36 0l-.63.61a.23.23 0 0 1-.32 0L8.71 12.7a.44.44 0 0 1 0-.63l.87-.5Zm15.87 2.95 1.3 1.28a.44.44 0 0 1 0 .63l-5.87 5.74a.46.46 0 0 1-.64 0l-4.17-4.08a.11.11 0 0 0-.16 0l-4.17 4.08a.46.46 0 0 1-.64 0l-5.87-5.74a.44.44 0 0 1 0-.63l1.3-1.28a.46.46 0 0 1 .64 0l4.17 4.08a.11.11 0 0 0 .16 0l4.17-4.08a.46.46 0 0 1 .64 0l4.17 4.08a.11.11 0 0 0 .16 0l4.17-4.08a.46.46 0 0 1 .64 0Z'/%3E%3C/svg%3E";

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

  public override get id(): string {
    return this.connector.id;
  }
  public override get icon(): string | undefined {
    if (!this.connector.icon && this.connector.type === 'walletConnect') {
      return WALLETCONNECT_ICON;
    }
    return this.connector.icon;
  }
}
