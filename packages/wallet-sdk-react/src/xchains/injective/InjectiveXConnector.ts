import type { XAccount } from '@/types/index.js';
import { XConnector } from '@/core/index.js';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import { type Wallet, isEvmBrowserWallet, isCosmosBrowserWallet } from '@injectivelabs/wallet-base';
import { isCosmosWalletInstalled } from '@injectivelabs/wallet-cosmos';
import { InjectiveXService } from './InjectiveXService.js';

const WALLET_ICONS: Partial<Record<Wallet, string>> = {
  metamask: 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/metamask.svg',
  keplr: 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/keplr.svg',
  leap: 'https://assets.leapwallet.io/logos/leap-cosmos-logo.svg',
  rabby: 'https://raw.githubusercontent.com/RabbyHub/logo/master/symbol.svg',
  phantom: 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/phantom.svg',
  'okx-wallet': 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
  'trust-wallet': 'https://trustwallet.com/assets/images/media/assets/twLogo.svg',
};

export class InjectiveXConnector extends XConnector {
  private wallet: Wallet;

  constructor(name: string, wallet: Wallet) {
    super('INJECTIVE', name, wallet);
    this.wallet = wallet;
  }

  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    if (isCosmosBrowserWallet(this.wallet) && !isCosmosWalletInstalled(this.wallet)) {
      console.warn(`[InjectiveXConnector] connect: ${this.wallet} cosmos wallet not installed`);
      return undefined;
    }

    const walletStrategy = this.getXService().walletStrategy;
    await walletStrategy.setWallet(this.wallet);
    const addresses = await walletStrategy.getAddresses();

    if (!addresses?.length) {
      console.warn(`[InjectiveXConnector] connect: ${this.wallet} returned no addresses`);
      return undefined;
    }

    const firstAddress = addresses[0];
    if (!firstAddress) {
      console.warn(`[InjectiveXConnector] connect: ${this.wallet} returned empty addresses array`);
      return undefined;
    }
    const address = isEvmBrowserWallet(this.wallet) ? getInjectiveAddress(firstAddress) : firstAddress;

    return {
      address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    if (isEvmBrowserWallet(this.wallet)) {
      const walletStrategy = this.getXService().walletStrategy;
      await walletStrategy.setWallet(this.wallet);
      await walletStrategy.disconnect();
    }
  }

  public override get icon(): string | undefined {
    return WALLET_ICONS[this.wallet];
  }
}
