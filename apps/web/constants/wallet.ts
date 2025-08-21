import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';

export type WalletItemProps = {
  name: string;
  xChainType: ChainType;
  icon: string;
  onConnectorsShown?: () => void;
  onConnectorsHidden?: () => void;
  forceShowConnectors?: boolean;
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void;
};

export const xChainTypes: WalletItemProps[] = [
  {
    name: 'ICON',
    xChainType: 'ICON',
    icon: '/coin/icx1.png',
  },
  // {
  //   name: 'EVM',
  //   xChainType: 'EVM',
  //   icon: '/coin/eth1.png',
  // },
  {
    name: 'SONIC',
    xChainType: 'EVM',
    icon: '/coin/s1.png',
  },
  // {
  //   name: 'Injective',
  //   xChainType: 'INJECTIVE',
  //   icon: '/coin/inj1.png',
  // },
  // {
  //   name: 'Solana',
  //   xChainType: 'SOLANA',
  //   icon: '/coin/sol.png',
  // },
  // {
  //   name: 'Sui',
  //   xChainType: 'SUI',
  //   icon: '/coin/sui1.png',
  // },
  // {
  //   name: 'Stellar',
  //   xChainType: 'STELLAR',
  //   icon: '/coin/ste1.png',
  // },
];
