import type { SpokeChainKey, ChainType, GetChainType } from '../chains/chains.js';
import type { IBitcoinWalletProvider } from '../bitcoin/bitcoin.js';
import type { IEvmWalletProvider } from '../evm/evm.js';
import type { IIconWalletProvider } from '../icon/icon.js';
import type { IInjectiveWalletProvider } from '../injective/injective.js';
import type { INearWalletProvider } from '../near/near.js';
import type { ISolanaWalletProvider } from '../solana/solana.js';
import type { IStacksWalletProvider } from '../stacks/stacks.js';
import type { IStellarWalletProvider } from '../stellar/stellar.js';
import type { ISuiWalletProvider } from '../sui/sui.js';

/**
 * Union of all chain-specific wallet providers. Narrow by the discriminant field
 * {@link IEvmWalletProvider.chainType} (and the same property on other variants), e.g.
 * `if (w.chainType === 'EVM')` refines `w` to {@link IEvmWalletProvider}.
 */
export type IWalletProvider =
  | IEvmWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IBitcoinWalletProvider
  | ISolanaWalletProvider
  | IStacksWalletProvider
  | INearWalletProvider;

/**
 * Wallet provider type for chain key or abstract {@link ChainType}.
 * If `C` is the full {@link SpokeChainKey} union (`SpokeChainKey extends C` is true), returns {@link IWalletProvider}.
 * Otherwise maps `C` to the matching chain-specific provider (or preserves the fallback union at the leaf).
 */
export type GetWalletProviderType<C extends SpokeChainKey | ChainType> = SpokeChainKey extends C
  ? IWalletProvider
  : GetChainType<C> extends 'EVM'
    ? IEvmWalletProvider
    : GetChainType<C> extends 'SOLANA'
      ? ISolanaWalletProvider
      : GetChainType<C> extends 'STELLAR'
        ? IStellarWalletProvider
        : GetChainType<C> extends 'ICON'
          ? IIconWalletProvider
          : GetChainType<C> extends 'SUI'
            ? ISuiWalletProvider
            : GetChainType<C> extends 'INJECTIVE'
              ? IInjectiveWalletProvider
              : GetChainType<C> extends 'STACKS'
                ? IStacksWalletProvider
                : GetChainType<C> extends 'NEAR'
                  ? INearWalletProvider
                  : GetChainType<C> extends 'BITCOIN'
                    ? IBitcoinWalletProvider
                    : IWalletProvider;
