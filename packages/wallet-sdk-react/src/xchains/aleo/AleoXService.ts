import { XService } from '@/core/XService';
import type { XToken } from '@sodax/types';
import { Network } from '@provablehq/aleo-types';
import { isNativeToken } from '../../utils';

// Lazy-load @provablehq/sdk to avoid triggering WASM initialization at import time.
// The WASM module uses top-level await which fails during SSR / Vercel builds.
// The SDK default export resolves to testnet — we must import the network-specific build.
type AleoSDK = typeof import('@provablehq/sdk');

function loadAleoSDK(network: Network): Promise<AleoSDK> {
  if (network === Network.TESTNET) return import('@provablehq/sdk/testnet.js') as unknown as Promise<AleoSDK>;
  return import('@provablehq/sdk/mainnet.js') as unknown as Promise<AleoSDK>;
}

export class AleoXService extends XService {
  private static instance: AleoXService;
  public network: Network = Network.MAINNET;

  // Lazily created after SDK loads; use ensureNetworkClient() in async methods.
  private _networkClient: Awaited<AleoSDK>['AleoNetworkClient']['prototype'] | null = null;
  public rpcUrl = 'https://api.provable.com/v2';

  private constructor() {
    super('ALEO');
  }

  private async ensureNetworkClient() {
    if (!this._networkClient) {
      const { AleoNetworkClient } = await loadAleoSDK(this.network);
      this._networkClient = new AleoNetworkClient(this.rpcUrl);
    }
    return this._networkClient;
  }

  public static getInstance(): AleoXService {
    if (!AleoXService.instance) {
      AleoXService.instance = new AleoXService();
    }
    return AleoXService.instance;
  }

  public setRpcUrl(url: string): void {
    this.rpcUrl = url;
    // Invalidate cached client so next async access creates one with the new URL
    this._networkClient = null;
  }

  // Both mainnet and testnet use the same base URL — the Provable SDK's AleoNetworkClient
  // handles network routing internally. We still invalidate the cached client so it picks
  // up any state change on the next async call.
  public setNetworkClient(network: Network): void {
    this.rpcUrl = 'https://api.provable.com/v2';
    this._networkClient = null;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    try {
      const networkClient = await this.ensureNetworkClient();

      if (isNativeToken(xToken)) {
        const mapping = await networkClient.getProgramMappingValue('credits.aleo', 'account', address);

        if (mapping) {
          const valueStr = mapping.toString().replace('u64', '');
          return BigInt(valueStr);
        }

        return 0n;
      }
      const { BHP256, Plaintext } = await loadAleoSDK(this.network);
      const bhp = new BHP256();
      const structLiteral = `{ account: ${address}, token_id: ${xToken.address}field }`;
      const plaintext = Plaintext.fromString(structLiteral);
      const key = bhp.hash(plaintext.toBitsLe()).toString();
      const result = await networkClient.getProgramMappingValue('token_registry.aleo', 'authorized_balances', key);
      if (result == null) return 0n;
      const match = result.match(/balance:\s*(\d+)u128/);
      return match?.[1] != null ? BigInt(match[1]) : 0n;
    } catch (e) {
      console.error('error AleoService: ', e);
      return BigInt(0);
    }
  }
}
