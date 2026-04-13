import type { XAccount } from '@/types';
import { XConnector } from '@/core';
import type { StacksProvider } from '@stacks/connect';

export interface StacksProviderConfig {
  /** The provider ID matching the window path, e.g. 'LeatherProvider' or 'XverseProviders.BitcoinProvider' */
  id: string;
  name: string;
  icon: string;
  installUrl?: string;
}

/** Resolves a provider from `window` by dot-separated ID, matching @stacks/connect-ui's getProviderFromId */
function getProviderFromId(id: string): StacksProvider | undefined {
  // biome-ignore lint/suspicious/noExplicitAny: window property traversal requires any
  return id.split('.').reduce<any>((acc, part) => acc?.[part], window) as StacksProvider | undefined;
}

/**
 * Lazy-load @stacks/connect to avoid Turbopack scope-hoisting cycle (#1070).
 * Cannot bundle via noExternal because transitive deps (@reown/appkit → WalletConnect → node-fetch)
 * import Node builtins (stream, http) that fail on platform: neutral and crash at SSR.
 */
let stacksConnectPromise: Promise<typeof import('@stacks/connect')> | undefined;
function getStacksConnect() {
  if (!stacksConnectPromise) {
    stacksConnectPromise = import('@stacks/connect').then(mod => {
      if (!mod.request || !mod.disconnect) throw new Error('@stacks/connect loaded but missing exports');
      return mod;
    });
  }
  return stacksConnectPromise;
}

export class StacksXConnector extends XConnector {
  private readonly config: StacksProviderConfig;

  constructor(config: StacksProviderConfig) {
    super('STACKS', config.name, config.id);
    this.config = config;
  }

  async connect(): Promise<XAccount | undefined> {
    const provider = this.getProvider();

    if (!provider) {
      if (this.config.installUrl) {
        window.open(this.config.installUrl, '_blank');
      }
      return undefined;
    }

    const { request } = await getStacksConnect();
    const response = await request({ provider }, 'stx_getAddresses') as unknown as { addresses: { address: string; purpose: string }[] };
    const stxAddress = response.addresses.find(a => a.purpose === 'stacks');

    if (!stxAddress) {
      console.warn('[StacksXConnector] wallet returned no stacks-purpose address');
      return undefined;
    }

    return {
      address: stxAddress.address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    const { disconnect } = await getStacksConnect();
    disconnect();
  }

  public get icon(): string {
    return this.config.icon;
  }

  public getProvider(): StacksProvider | undefined {
    return getProviderFromId(this.config.id);
  }
}
