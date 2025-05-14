import type { XChainType } from '@/types';
import type { XConnector } from './XConnector';

export abstract class XService {
  xChainType: XChainType;
  xConnectors: XConnector[] = [];

  constructor(xChainType: XChainType) {
    this.xChainType = xChainType;
  }

  getXConnectors(): XConnector[] {
    return this.xConnectors;
  }

  setXConnectors(xConnectors: XConnector[]): void {
    this.xConnectors = xConnectors;
  }

  getXConnectorById(xConnectorId: string): XConnector | undefined {
    return this.getXConnectors().find(xConnector => xConnector.id === xConnectorId);
  }
}
