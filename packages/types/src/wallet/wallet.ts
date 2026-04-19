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

// union of all wallet provider interfaces
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
