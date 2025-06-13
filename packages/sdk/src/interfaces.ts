import type {
  StellarRawTransactionReceipt,
  XDR,
  WalletAddressProvider,
} from './index.js';

export interface IStellarWalletProvider extends WalletAddressProvider {
  signTransaction: (tx: XDR) => Promise<XDR>;
  waitForTransactionReceipt: (txHash: string) => Promise<StellarRawTransactionReceipt>;
}
