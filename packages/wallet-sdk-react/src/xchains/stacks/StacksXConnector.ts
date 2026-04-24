import type { XAccount } from '@/types/index.js';
import { XConnector } from '@/core/index.js';
import type { StacksProvider } from '@stacks/connect';
import { request, disconnect } from '@stacks/connect';

export interface StacksProviderConfig {
  /** The provider ID matching the window path, e.g. 'LeatherProvider' or 'XverseProviders.BitcoinProvider' */
  id: string;
  name: string;
  icon: string;
  installUrl?: string;
}

/** Resolves a provider from `window` by dot-separated ID, matching @stacks/connect-ui's getProviderFromId */
function getProviderFromId(id: string): StacksProvider | undefined {
  return id.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], window) as
    | StacksProvider
    | undefined;
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
        window.open(this.config.installUrl, '_blank', 'noopener,noreferrer');
      }
      return undefined;
    }

    const response = await request({ provider }, 'stx_getAddresses');
    // Stacks SDK types don't include `purpose` on AddressEntry, but wallets return it at runtime
    const stxAddress = response.addresses.find(a => (a as unknown as { purpose?: string }).purpose === 'stacks');

    if (!stxAddress) {
      console.warn(
        `[StacksXConnector] ${this.config.name}: no address with purpose="stacks" returned from stx_getAddresses`,
        response.addresses,
      );
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

  public override get icon(): string {
    return this.config.icon;
  }

  public override get isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return getProviderFromId(this.config.id) !== undefined;
  }

  public override get installUrl(): string | undefined {
    return this.config.installUrl;
  }

  public getProvider(): StacksProvider | undefined {
    return getProviderFromId(this.config.id);
  }
}
