import type {
  SpokeChainKey,
  ChainType,
  GetChainType,
  IBitcoinWalletProvider,
  IEvmWalletProvider,
  IIconWalletProvider,
  IInjectiveWalletProvider,
  INearWalletProvider,
  ISolanaWalletProvider,
  IStacksWalletProvider,
  IStellarWalletProvider,
  ISuiWalletProvider,
} from '../index.js';

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
  getPublicKey?: () => Promise<string>;
}

export interface ICoreWallet extends WalletAddressProvider {}

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

// GetWalletProviderType is used to get the wallet provider type for a given chain id or chain type
export type GetWalletProviderType<C extends SpokeChainKey | ChainType> = GetChainType<C> extends 'EVM'
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
