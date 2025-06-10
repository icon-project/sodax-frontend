import { XService } from '@/core/XService';
import { ArchwayClient } from '@archwayhq/arch3.js';
import type { XSigningArchwayClient } from './XSigningArchwayClient';

export class ArchwayXService extends XService {
  private static instance: ArchwayXService;

  public rpcURL = 'https://rpc.mainnet.archway.io';
  public chainId = 'archway-1';
  public publicClient: ArchwayClient | null = null;
  public walletClient: XSigningArchwayClient | null = null;

  private constructor() {
    super('ARCHWAY');
    this.init();
  }

  public async init() {
    this.publicClient = await ArchwayClient.connect(this.rpcURL);
  }

  public setWalletClient(walletClient: XSigningArchwayClient | null) {
    this.walletClient = walletClient;
  }

  public static getInstance(): ArchwayXService {
    if (!ArchwayXService.instance) {
      ArchwayXService.instance = new ArchwayXService();
    }
    return ArchwayXService.instance;
  }
}
