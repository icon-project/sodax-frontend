import IconService from 'icon-sdk-js';
import type { Hash, Hex } from 'viem';
import type { HttpPrefixedUrl, IconEoaAddress, WalletAddressProvider } from '../../index.js';
import { requestJsonRpc } from './HanaWalletConnector.js';
import { getIconAddressBytes } from './utils.js';

export class IconWalletProvider implements WalletAddressProvider {
  private readonly wallet: Hex | IconEoaAddress;
  public readonly iconService: IconService.IconService;

  constructor(wallet: Hex | IconEoaAddress, url: HttpPrefixedUrl) {
    this.wallet = wallet;
    this.iconService = new IconService.IconService(new IconService.HttpProvider(url));
  }

  public async sendTransaction(tx: IconService.CallTransaction): Promise<Hash> {
    if (!this.wallet.startsWith('0x')) {
      // if wallet starts with 0x, it's a private key
      const result = await requestJsonRpc(tx);
      if (!result.ok) {
        throw new Error('Failed to send transaction');
      }
      return result.value.result as Hash;
    }
    const pkWallet = IconService.Wallet.loadPrivateKey(this.wallet.slice(2));
    const signedTx = new IconService.SignedTransaction(tx, pkWallet);
    const result: string = await this.iconService.sendTransaction(signedTx).execute();
    return result as Hash;
  }

  getWalletAddress(): string {
    if (!this.wallet.startsWith('0x')) return this.wallet;

    return IconService.Wallet.loadPrivateKey(this.wallet.slice(2)).getAddress();
  }

  getWalletAddressBytes(): Hex {
    return getIconAddressBytes(this.getWalletAddress());
  }
}
