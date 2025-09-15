import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk-react';

export type WalletItemProps = {
  name: string;
  xChainType: ChainType;
  icon: string;
  onConnectorsShown?: () => void;
  onConnectorsHidden?: () => void;
  forceShowConnectors?: boolean;
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void;
};

// TODO: remove this
export const xChainTypes: WalletItemProps[] = [
  {
    name: 'EVM',
    xChainType: 'EVM',
    icon: '/coin/s1.png',
  },
  {
    name: 'ICON',
    xChainType: 'ICON',
    icon: '/chain/0x1.icon.png',
  },
  {
    name: 'Injective',
    xChainType: 'INJECTIVE',
    icon: '/chain/injective-1.png',
  },
  {
    name: 'Solana',
    xChainType: 'SOLANA',
    icon: '/chain/solana.png',
  },
  {
    name: 'Sui',
    xChainType: 'SUI',
    icon: '/chain/sui.png',
  },
  {
    name: 'Stellar',
    xChainType: 'STELLAR',
    icon: '/chain/stellar.png',
  },
];
