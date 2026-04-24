import type { ChainType } from "../chains/chain-keys.js";
import type { XToken } from "../chains/tokens.js";

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
  getPublicKey?: () => Promise<string>;
}

export interface ICoreWallet extends WalletAddressProvider {}

/**
 * Base chain-aware service contract — the minimum shape for reading token
 * balances on a chain. Extended by `wallet-sdk-react.IXService` with
 * connector methods.
 */
export interface IXServiceBase {
  readonly xChainType: ChainType;
  getBalance(address: string | undefined, xToken: XToken): Promise<bigint>;
  getBalances(
    address: string | undefined,
    xTokens: readonly XToken[],
  ): Promise<Record<string, bigint>>;
}
