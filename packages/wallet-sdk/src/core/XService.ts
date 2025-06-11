import type { ChainId, ChainType, XToken } from '@sodax/types';
import type { XConnector } from './XConnector';
export abstract class XService {
  xChainType: ChainType;
  xConnectors: XConnector[] = [];

  constructor(xChainType: ChainType) {
    this.xChainType = xChainType;
  }

  async getBalance(address: string | undefined, xToken: XToken, xChainId: ChainId): Promise<bigint> {
    return 0n;
  }

  async getBalances(address: string | undefined, xTokens: XToken[], xChainId: ChainId) {
    if (!address) return {};

    return xTokens.reduce((acc, xToken) => {
      acc[xToken.address] = this.getBalance(address, xToken, xChainId);
      return acc;
    }, {});
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
