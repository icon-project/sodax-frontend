import {
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '@sodax/types';

export const CHAIN_TX_EXPLORERS = {
  [ETHEREUM_MAINNET_CHAIN_ID]: 'https://etherscan.io/tx/',
  [ARBITRUM_MAINNET_CHAIN_ID]: 'https://arbiscan.io/tx/',
  [OPTIMISM_MAINNET_CHAIN_ID]: 'https://optimistic.etherscan.io/tx/',
  [BASE_MAINNET_CHAIN_ID]: 'https://basescan.org/tx/',
  [POLYGON_MAINNET_CHAIN_ID]: 'https://polygonscan.com/tx/',
  [BSC_MAINNET_CHAIN_ID]: 'https://bscscan.com/tx/',
  [AVALANCHE_MAINNET_CHAIN_ID]: 'https://snowtrace.io/tx/',
  [SONIC_MAINNET_CHAIN_ID]: 'https://sonicscan.org/tx/',

  // non-EVM
  [SOLANA_MAINNET_CHAIN_ID]: 'https://solscan.io/tx/',
  [SUI_MAINNET_CHAIN_ID]: 'https://suiexplorer.com/tx/',
  [STELLAR_MAINNET_CHAIN_ID]: 'https://stellar.expert/explorer/public/tx/',
  [INJECTIVE_MAINNET_CHAIN_ID]: 'https://explorer.injective.network/transaction/',

  // ICON ecosystem
  [ICON_MAINNET_CHAIN_ID]: 'https://tracker.icon.community/transaction/',
  [HYPEREVM_MAINNET_CHAIN_ID]: 'https://explorer.hyperchain.io/tx/',
  [LIGHTLINK_MAINNET_CHAIN_ID]: 'https://phoenix.lightlink.io/tx/',
};
