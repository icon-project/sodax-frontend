import { defineChain, type Address, type Chain } from 'viem';
import { arbitrum, avalanche, base, bsc, nibiru, optimism, polygon, sonic, lightlinkPhoenix } from 'viem/chains';
import type {
  InjectiveSpokeChainConfig,
  EvmChainId,
  EvmHubChainConfig,
  EvmSpokeChainConfig,
  HubAssetInfo,
  IconSpokeChainConfig,
  IntentRelayChainId,
  MoneyMarketConfig,
  OriginalAssetAddress,
  SolanaChainConfig,
  SolverConfig,
  SonicSpokeChainConfig,
  StellarSpokeChainConfig,
  SuiSpokeChainConfig,
  VaultType,
  ConcentratedLiquidityConfig,
  LegacybnUSDChainId,
  LegacybnUSDToken,
  NewbnUSDChainId,
  XToken,
} from './index.js';
import {
  type ChainId,
  type Token,
  type SpokeChainId,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  type HubChainId,
  CHAIN_IDS,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
} from '@sodax/types';
import type { PoolKey } from '@pancakeswap/infinity-sdk';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RELAY_TX_TIMEOUT = 120000; // 120 seconds
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;
export const MAX_UINT256 = (1n << 256n) - 1n;
export const FEE_PERCENTAGE_SCALE = 10000n; // 100% = 10000
export const STELLAR_PRIORITY_FEE = '10000';
export const STELLAR_DEFAULT_TX_TIMEOUT_SECONDS = 100;
export const DEFAULT_DEADLINE_OFFSET = 300n; // 5 minutes in seconds
export const DEFAULT_BACKEND_API_ENDPOINT = 'https://apiv1.coolify.iconblockchain.xyz';
export const DEFAULT_BACKEND_API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_BACKEND_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const VAULT_TOKEN_DECIMALS = 18;

export const EVM_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
] as const;

// NOTE: This is not the same as the actual chain ids (wormhole based ids), only used for intent relay
export const ChainIdToIntentRelayChainId = {
  [AVALANCHE_MAINNET_CHAIN_ID]: 6n,
  [ARBITRUM_MAINNET_CHAIN_ID]: 23n,
  [BASE_MAINNET_CHAIN_ID]: 30n,
  [BSC_MAINNET_CHAIN_ID]: 4n,
  [INJECTIVE_MAINNET_CHAIN_ID]: 19n,
  [SONIC_MAINNET_CHAIN_ID]: 146n,
  [OPTIMISM_MAINNET_CHAIN_ID]: 24n,
  [POLYGON_MAINNET_CHAIN_ID]: 5n,
  [SOLANA_MAINNET_CHAIN_ID]: 1n,
  [SUI_MAINNET_CHAIN_ID]: 21n,
  [STELLAR_MAINNET_CHAIN_ID]: 27n,
  [ICON_MAINNET_CHAIN_ID]: 1768124270n,
  [NIBIRU_MAINNET_CHAIN_ID]: 7235938n,
  [HYPEREVM_MAINNET_CHAIN_ID]: 26745n,
  [LIGHTLINK_MAINNET_CHAIN_ID]: 27756n,
} as const;

export const getIntentRelayChainId = (chainId: ChainId): IntentRelayChainId => ChainIdToIntentRelayChainId[chainId];

// HyperEVM chain is not supported by viem, so we need to define it manually
export const hyper = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
});

export function getEvmViemChain(id: EvmChainId): Chain {
  switch (id) {
    case SONIC_MAINNET_CHAIN_ID:
      return sonic;
    case AVALANCHE_MAINNET_CHAIN_ID:
      return avalanche;
    case ARBITRUM_MAINNET_CHAIN_ID:
      return arbitrum;
    case BASE_MAINNET_CHAIN_ID:
      return base;
    case OPTIMISM_MAINNET_CHAIN_ID:
      return optimism;
    case BSC_MAINNET_CHAIN_ID:
      return bsc;
    case POLYGON_MAINNET_CHAIN_ID:
      return polygon;
    case NIBIRU_MAINNET_CHAIN_ID:
      return nibiru;
    case HYPEREVM_MAINNET_CHAIN_ID:
      return hyper;
    case LIGHTLINK_MAINNET_CHAIN_ID:
      return lightlinkPhoenix;
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

export const HubVaultSymbols = [
  'sodaAVAX',
  'sodaBNB',
  'sodaETH',
  'sodaBTC',
  'sodaSUI',
  'sodaINJ',
  'sodaXLM',
  'sodaSOL',
  'sodaSODA',
  'sodaUSDT',
  'sodaUSDC',
  'bnUSD',
  'sodaPOL',
  'sodaNIBI',
  'sodaS',
  'IbnUSD',
  'sodaHYPE',
] as const;

export type HubVaultSymbol = (typeof HubVaultSymbols)[number];

export const SodaTokens = {
  sodaBNB: {
    symbol: 'sodaBNB',
    name: 'Soda BNB',
    decimals: 18,
    address: '0x40Cd41b35DB9e5109ae7E54b44De8625dB320E6b',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaAVAX: {
    symbol: 'sodaAVAX',
    name: 'Soda AVAX',
    decimals: 18,
    address: '0x14238D267557E9d799016ad635B53CD15935d290',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaETH: {
    symbol: 'sodaETH',
    name: 'Soda ETH',
    decimals: 18,
    address: '0x4effB5813271699683C25c734F4daBc45B363709',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaBTC: {
    symbol: 'sodaBTC',
    name: 'Soda BTC',
    decimals: 18,
    address: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaSOL: {
    symbol: 'sodaSOL',
    name: 'Soda SOL',
    decimals: 18,
    address: '0xdEa692287E2cE8Cb08FA52917Be0F16b1DACDC87',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaXLM: {
    symbol: 'sodaXLM',
    name: 'Soda XLM',
    decimals: 18,
    address: '0x6BC8C37cba91F76E68C9e6d689A9C21E4d32079B',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaINJ: {
    symbol: 'sodaINJ',
    name: 'Soda INJ',
    decimals: 18,
    address: '0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaNIBI: {
    symbol: 'sodaNIBI',
    name: 'Soda NIBI',
    decimals: 18,
    address: '0xc6c85287a8b173A509C2F198bB719A8a5a2d0C68',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaSUI: {
    symbol: 'sodaSUI',
    name: 'Soda SUI',
    decimals: 18,
    address: '0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  bnUSD: {
    symbol: 'bnUSD',
    name: 'Balanced Dollar',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaUSDC: {
    symbol: 'sodaUSDC',
    name: 'Soda USDC',
    decimals: 18,
    address: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaUSDT: {
    symbol: 'sodaUSDT',
    name: 'Soda USDT',
    decimals: 18,
    address: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  IbnUSD: {
    symbol: 'IbnUSD',
    name: 'ICON bnUSD (Migration)',
    decimals: 18,
    address: '0x9D4b663Eb075d2a1C7B8eaEFB9eCCC0510388B51',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaS: {
    symbol: 'sodaS',
    name: 'Soda S',
    decimals: 18,
    address: '0x62ecc3Eeb80a162c57624B3fF80313FE69f5203e',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaPOL: {
    symbol: 'sodaPOL',
    name: 'Soda POL',
    decimals: 18,
    address: '0x208ED38f4783328aA9eBFeC360D32e7520A9B779',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaSODA: {
    symbol: 'sodaSODA',
    name: 'Soda SODA',
    decimals: 18,
    address: '0x21685E341DE7844135329914Be6Bd8D16982d834',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
  sodaHYPE: {
    symbol: 'sodaHYPE',
    name: 'Soda HYPE',
    decimals: 18,
    address: '0x6E81124fC5d2Bf666B16a0A5d90066eBf35c7411',
    xChainId: SONIC_MAINNET_CHAIN_ID,
  },
} as const satisfies Record<HubVaultSymbol, XToken & { symbol: HubVaultSymbol }>;

export const SodaTokensAsHubAssets: Record<
  string,
  { asset: Address; decimal: number; vault: Address; symbol: string; name: string }
> = Object.values(SodaTokens).reduce(
  (acc, token) => {
    acc[token.address] = {
      asset: token.address,
      decimal: token.decimals,
      symbol: token.symbol,
      name: token.name,
      vault: token.address,
    };
    return acc;
  },
  {} as Record<string, { asset: Address; decimal: number; vault: Address; symbol: string; name: string }>,
);
export const SodaVaultTokensSet = new Set(Object.values(SodaTokens).map(token => token.address.toLowerCase()));
export const isSodaVaultToken = (address: string): boolean => {
  return SodaVaultTokensSet.has(address.toLowerCase());
};

const hubChainConfig: Record<HubChainId, EvmHubChainConfig> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Sonic',
      id: SONIC_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x60c5681bD1DB4e50735c4cA3386005A4BA4937C0',
      hubWallet: '0xA0ed3047D358648F2C0583B415CffCA571FDB544',
      xTokenManager: '0x5bD2843de9D6b0e6A05d0FB742072274EA3C6CA3',
      icxMigration: '0x8294DE9fc60F5ABCc19245E5857071d7C42B9875',
      balnSwap: '0x610a90B61b89a98b954d5750E94834Aa45d08d10',
      sodaToken: '0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963', // SODA token on Sonic
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    wrappedNativeToken: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    supportedTokens: [],
  } satisfies EvmHubChainConfig,
} as const;

export const getHubChainConfig = (chainId: HubChainId): EvmHubChainConfig => hubChainConfig[chainId];

export const spokeChainConfig = {
  [SONIC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Sonic',
      id: SONIC_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      walletRouter: '0xC67C3e55c665E78b25dc9829B3Aa5af47d914733',
      wrappedSonic: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    supportedTokens: {
      S: {
        symbol: 'S',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x6047828dc181963ba44974801FF68e538dA5eaF9',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      wS: {
        symbol: 'wS',
        name: 'Wrapped Sonic',
        decimals: 18,
        address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x7c7d53EEcda37a87ce0D5bf8E0b24512A48dC963',
        xChainId: SONIC_MAINNET_CHAIN_ID,
      },
      ...SodaTokens,
    },
  } as const satisfies SonicSpokeChainConfig,
  [SOLANA_MAINNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'AnCCJjheynmGqPp6Vgat9DTirGKD4CtQzP8cwTYV8qKH',
      connection: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB',
      rateLimit: '2Vyy3A3Teju2EMCkdnappEeWqBXyAaF5V2WsrU4hDtsk',
      testToken: '3Q2HS3png7fLaYerqCun3zw8rnBZo2Ksvdg6RHTyM4Ns',
      xTokenManager: '',
    },
    chain: { id: SOLANA_MAINNET_CHAIN_ID, name: 'Solana', type: 'SOLANA' },
    nativeToken: '11111111111111111111111111111111' as const,
    bnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
    supportedTokens: {
      SOL: {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        address: '11111111111111111111111111111111',
        xChainId: SOLANA_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 9,
        address: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
        xChainId: SOLANA_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        xChainId: SOLANA_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 9,
        address: '8Bj8gSbga8My8qRkT1RrvgxFBExiGFgdRNHFaR9o2T3Q',
        xChainId: SOLANA_MAINNET_CHAIN_ID,
      },
    },
    gasPrice: '500000',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    walletAddress: '',
  } as const satisfies SolanaChainConfig,
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Avalanche',
      id: AVALANCHE_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x5bDD1E1C5173F4c912cC919742FB94A55ECfaf86',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
    supportedTokens: {
      AVAX: {
        symbol: 'AVAX',
        name: 'Avalanche',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: AVALANCHE_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
        xChainId: AVALANCHE_MAINNET_CHAIN_ID,
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        xChainId: AVALANCHE_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        xChainId: AVALANCHE_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x390ceed555905ec225Da330A188EA04e85570f00',
        xChainId: AVALANCHE_MAINNET_CHAIN_ID,
      },
    },
  } as const satisfies EvmSpokeChainConfig,
  [NIBIRU_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Nibiru',
      id: NIBIRU_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
      connection: '0x772FFE538E45b2cDdFB5823041EC26C44815B9AB',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x043fb7e23350Dd5b77dE5E228B528763DEcb9131',
    supportedTokens: {
      NIBI: {
        symbol: 'NIBI',
        name: 'Nibiru',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: NIBIRU_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x043fb7e23350Dd5b77dE5E228B528763DEcb9131',
        xChainId: NIBIRU_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x5bda87f18109CA85fa7ADDf1D48B97734e9dc6F5',
        xChainId: NIBIRU_MAINNET_CHAIN_ID,
      },
    },
  } as const satisfies EvmSpokeChainConfig,
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Arbitrum',
      id: ARBITRUM_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xA256dd181C3f6E5eC68C6869f5D50a712d47212e',
    supportedTokens: {
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xA256dd181C3f6E5eC68C6869f5D50a712d47212e',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x5979D7b546E38E414F7E9822514be443A4800529',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      tBTC: {
        symbol: 'tBTC',
        name: 'Arbitrum tBTC v2',
        decimals: 18,
        address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      WBTC: {
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 8,
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin (USDC)',
        decimals: 6,
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      USDT: {
        symbol: 'USDT',
        name: 'TetherToken',
        decimals: 6,
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [BASE_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'BASE',
      id: BASE_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa',
    supportedTokens: {
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      cbBTC: {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        decimals: 8,
        address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3',
        xChainId: BASE_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Optimism',
      id: OPTIMISM_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
    supportedTokens: {
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13',
        xChainId: OPTIMISM_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [BSC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'BSC',
      id: BSC_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x8428FedC020737a5A2291F46cB1B80613eD71638',
    supportedTokens: {
      BNB: {
        symbol: 'BNB',
        name: 'BNB',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x8428FedC020737a5A2291F46cB1B80613eD71638',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
      ETHB: {
        symbol: 'ETHB',
        name: 'Ethereum BSC',
        decimals: 18,
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
      BTCB: {
        symbol: 'BTCB',
        name: 'Bitcoin BSC',
        decimals: 18,
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 18,
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3',
        xChainId: BSC_MAINNET_CHAIN_ID,
      },
    },
  } as const satisfies EvmSpokeChainConfig,
  [POLYGON_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Polygon',
      id: POLYGON_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
    supportedTokens: {
      POL: {
        symbol: 'POL',
        name: 'Polygon',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: POLYGON_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
        xChainId: POLYGON_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        xChainId: POLYGON_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0xDDF645F33eDAD18fC23E01416eD0267A1bF59D45',
        xChainId: POLYGON_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [HYPEREVM_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'HyperEVM',
      id: HYPEREVM_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0xAfd6A6e4287A511D3BAAd013093815268846FBb7',
      connection: '0xA143488cDc5B74B366231E6A4d5a55A2D9Dc8484',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x506Ba7C8d91dAdf7a91eE677a205D9687b751579',
    supportedTokens: {
      HYPE: {
        symbol: 'HYPE',
        name: 'HYPE',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: HYPEREVM_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x506Ba7C8d91dAdf7a91eE677a205D9687b751579',
        xChainId: HYPEREVM_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0xA28C70F92a1B2513edCdDD29c2E5195a4B785aB2',
        xChainId: HYPEREVM_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [LIGHTLINK_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'lightlink',
      id: LIGHTLINK_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
    addresses: {
      assetManager: '0x4A1C82744cDDeE675A255fB289Cb0917A482e7C7',
      connection: '0x6D2126DB97dd88AfA85127253807D04A066b6746',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x36134A03dcD03Bbe858B8F7ED28a71AAC608F9E7',
    supportedTokens: {
      ETH: {
        symbol: 'ETH',
        name: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x36134A03dcD03Bbe858B8F7ED28a71AAC608F9E7',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: '0x6BC8C37cba91F76E68C9e6d689A9C21E4d32079B',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xbCF8C1B03bBDDA88D579330BDF236B58F8bb2cFd',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'BTC.LL': {
        symbol: 'BTC.LL',
        name: 'Bitcoin LightLink',
        decimals: 18,
        address: '0x5E921D8B7709b409132628258A53449D1fD82341',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'AVAX.LL': {
        symbol: 'AVAX.LL',
        name: 'Avalanche LightLink',
        decimals: 18,
        address: '0x373d9c5390535e9e30185E52826d45b76df09aBb',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'BNB.LL': {
        symbol: 'BNB.LL',
        name: 'BNB LightLink',
        decimals: 18,
        address: '0xe80c2B7674dCdF47b199697E2c61730231b8da89',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'SOL.LL': {
        symbol: 'SOL.LL',
        name: 'Solana LightLink',
        decimals: 18,
        address: '0xba9af7029Ae5c1054Fc367d5D6a47Dc3D5c0D6bA',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'XLM.LL': {
        symbol: 'XLM.LL',
        name: 'Stellar LightLink',
        decimals: 18,
        address: '0x03beDD719b6d8de11f5B2671b2f30085a626F8Da',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'INJ.LL': {
        symbol: 'INJ.LL',
        name: 'Injective LightLink',
        decimals: 18,
        address: '0x8a4C8B1A899Fa9D9246a112E8D43EC0C97b77B8C',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'SUI.LL': {
        symbol: 'SUI.LL',
        name: 'Sui LightLink',
        decimals: 18,
        address: '0x59e68e2F5147F74F27FD173397a7419C1e5d9999',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'S.LL': {
        symbol: 'S.LL',
        name: 'Sonic LightLink',
        decimals: 18,
        address: '0xb3A47798CB6585Ea0d31a7986f2a04b25C60247f',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'POL.LL': {
        symbol: 'POL.LL',
        name: 'Polygon LightLink',
        decimals: 18,
        address: '0xE963bfb4757fC8Ae66BC68E11e636f8fbafAfCb4',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
      'HYPE.LL': {
        symbol: 'HYPE.LL',
        name: 'HyperEVM LightLink',
        decimals: 18,
        address: '0x127b64fb645279F8aca786c507b94dde81F02d16',
        xChainId: LIGHTLINK_MAINNET_CHAIN_ID,
      },
    } as const,
  } as const satisfies EvmSpokeChainConfig,
  [INJECTIVE_MAINNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'inj1dg6tm62uup53wn2kn97caeqfwt0sukx3qjk8rw',
      connection: 'inj1eexvfglsptxwfj9hft96xcnsdrvr7d7dalcm8w',
      rateLimit: 'inj1x8p2h56edcdrm9tzx7a7zkwe0l334klgrxpqyk',
      testToken: '',
      xTokenManager: '',
    },
    chain: {
      id: INJECTIVE_MAINNET_CHAIN_ID,
      name: 'Injective',
      type: 'INJECTIVE',
    },
    nativeToken: 'inj' as const,
    bnUSD: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/bnUSD',
    networkId: 'injective-1',
    supportedTokens: {
      INJ: {
        symbol: 'INJ',
        name: 'Injective',
        decimals: 18,
        address: 'inj',
        xChainId: INJECTIVE_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/bnUSD',
        xChainId: INJECTIVE_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: 'ibc/2CBC2EA121AE42563B08028466F37B600F2D7D4282342DE938283CC3FB2BC00E',
        xChainId: INJECTIVE_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 18,
        address: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/soda',
        xChainId: INJECTIVE_MAINNET_CHAIN_ID,
      },
    },
    gasPrice: '500000000inj',
    network: 'Mainnet',
    prefix: 'inj',
    isBrowser: false,
    rpcUrl: 'https://injective-rpc.publicnode.com:443',
    walletAddress: '',
  } as const satisfies InjectiveSpokeChainConfig,
  [STELLAR_MAINNET_CHAIN_ID]: {
    addresses: {
      connection: 'CDFQDDPUPAM3XPGORHDOEFRNLMKOH3N3X6XTXNLSXJQXIU3RVCM3OPEP',
      assetManager: 'CCGF33A4CO6D3BXFEKPXVCFCZBK76I3AQOZK6KIKRPAWAZR3632WHCJ3',
      xTokenManager: '',
      rateLimit: 'CB6G3ULISTTBPXUN3BI6ADHQGWJEN7BPQINHL45TCB6TDFM5QWU24HAY',
      testToken: '',
    },
    trustlineConfigs: [
      {
        assetCode: 'USDC',
        contractId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
        assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      },
      {
        assetCode: 'bnUSD',
        contractId: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
        assetIssuer: 'GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA',
      },
      {
        assetCode: 'SODA',
        contractId: 'CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM',
        assetIssuer: 'GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA',
      },
    ],
    supportedTokens: {
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 7,
        address: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
        xChainId: STELLAR_MAINNET_CHAIN_ID,
      },
      XLM: {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        decimals: 7,
        address: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
        xChainId: STELLAR_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 7,
        address: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
        xChainId: STELLAR_MAINNET_CHAIN_ID,
      },
      legacybnUSD: {
        symbol: 'bnUSD (legacy)',
        name: 'legacybnUSD',
        decimals: 18,
        address: 'CCT4ZYIYZ3TUO2AWQFEOFGBZ6HQP3GW5TA37CK7CRZVFRDXYTHTYX7KP',
        xChainId: STELLAR_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 7,
        address: 'CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM',
        xChainId: STELLAR_MAINNET_CHAIN_ID,
      },
    },
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA' as const,
    bnUSD: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://rpc.ankr.com/stellar_soroban',
    chain: {
      name: 'Stellar',
      id: STELLAR_MAINNET_CHAIN_ID,
      type: 'STELLAR',
    },
  } as const satisfies StellarSpokeChainConfig,
  [SUI_MAINNET_CHAIN_ID]: {
    addresses: {
      connection:
        '0xf3b1e696a66d02cb776dc15aae73c68bc8f03adcb6ba0ec7f6332d9d90a6a3d2::connectionv3::0x3ee76d13909ac58ae13baab4c9be5a5142818d9a387aed641825e5d4356969bf',
      assetManagerConfigId: '0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
      originalAssetManager:
        '0xa17a409164d1676db71b411ab50813ba2c7dd547d2df538c699049566f1ff922::asset_manager::0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
      xTokenManager: '',
      rateLimit: '',
      testToken: '',
    },
    supportedTokens: {
      SUI: {
        symbol: 'SUI',
        name: 'SUI',
        decimals: 9,
        address: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 9,
        address: '0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      legacybnUSD: {
        symbol: 'bnUSD (legacy)',
        name: 'legacybnUSD',
        decimals: 9,
        address: '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      afSUI: {
        symbol: 'afSUI',
        name: 'Aftermath Staked Sui',
        decimals: 9,
        address: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      mSUI: {
        symbol: 'mSUI',
        name: 'Mirai Staked SUI',
        decimals: 9,
        address: '0x922d15d7f55c13fd790f6e54397470ec592caa2b508df292a2e8553f3d3b274f::msui::MSUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      haSUI: {
        symbol: 'haSUI',
        name: 'haSUI',
        decimals: 9,
        address: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      vSUI: {
        symbol: 'vSUI',
        name: 'Volo Staked SUI',
        decimals: 9,
        address: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      yapSUI: {
        symbol: 'yapSUI',
        name: 'Yap Staked SUI',
        decimals: 9,
        address: '0x83f1bb8c91ecd1fd313344058b0eed94d63c54e41d8d1ae5bff1353443517d65::yap_sui::YAP_SUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      trevinSUI: {
        symbol: 'trevinSUI',
        name: 'Trevin Staked SUI',
        decimals: 9,
        address: '0x502867b177303bf1bf226245fcdd3403c177e78d175a55a56c0602c7ff51c7fa::trevin_sui::TREVIN_SUI',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
      SODA: {
        symbol: 'SODA',
        name: 'SODAX',
        decimals: 9,
        address: '0x0a0393721732617a2a771535e83c0a46f04aeef7d03239bbbb1249bc0981b952::soda::SODA',
        xChainId: SUI_MAINNET_CHAIN_ID,
      },
    },
    nativeToken: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI' as const,
    bnUSD: '0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD',
    rpc_url: 'https://fullnode.mainnet.sui.io:443',
    chain: {
      name: 'Sui',
      id: SUI_MAINNET_CHAIN_ID,
      type: 'SUI',
    },
  } as const satisfies SuiSpokeChainConfig,
  [ICON_MAINNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'cx1be33c283c7dc7617181d1b21a6a2309e71b1ee7',
      connection: 'cxe5cdf3b0f26967b0efc72d470d57bbf534268f94',
      rateLimit: 'cxbbdcea9e6757023a046067ba8daa3c4c50304358',
      wICX: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
    },
    chain: {
      id: ICON_MAINNET_CHAIN_ID,
      name: 'ICON',
      type: 'ICON',
    },
    supportedTokens: {
      ICX: {
        symbol: 'ICX',
        name: 'ICON',
        decimals: 18,
        address: 'cx0000000000000000000000000000000000000000',
        xChainId: ICON_MAINNET_CHAIN_ID,
      },
      wICX: {
        symbol: 'wICX',
        name: 'Wrapped ICX',
        decimals: 18,
        address: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
        xChainId: ICON_MAINNET_CHAIN_ID,
      },
      bnUSD: {
        // same as legacy
        symbol: 'bnUSD (legacy)',
        name: 'bnUSD',
        decimals: 18,
        address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
        xChainId: ICON_MAINNET_CHAIN_ID,
      },
      legacybnUSD: {
        // duplicate of bnUSD  purely for consistency with other legacy tokens chains (sui, stellar)
        symbol: 'bnUSD (legacy)',
        name: 'bnUSD',
        decimals: 18,
        address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
        xChainId: ICON_MAINNET_CHAIN_ID,
      },
      BALN: {
        symbol: 'BALN',
        name: 'BALN',
        decimals: 18,
        address: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
        xChainId: ICON_MAINNET_CHAIN_ID,
      },
    } as const,
    nativeToken: 'cx0000000000000000000000000000000000000000' as const,
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    nid: '0x1',
  } as const satisfies IconSpokeChainConfig,
} as const;

// All addresses are now lowercase for consistency and correctness
export const hubVaults = {
  [SodaTokens.IbnUSD.symbol]: {
    // ICON bnUSD (Migration) vault on Sonic contains legacy bnUSD tokens (stellar, sui, icon)
    address: '0x9D4b663Eb075d2a1C7B8eaEFB9eCCC0510388B51',
    reserves: [
      // hub asset addresses contained in the vault
      '0x654DdDf32a9a2aC53f5FB54bf1e93F66791f8047',
      '0xddf6AD38F9C9451C1F4cDf369040F6869e37393e',
      '0x1559B52d2e165da1505a542EA37C543c9137f52a',
    ] as const,
  },
  [SodaTokens.sodaS.symbol]: {
    address: '0x62ecc3eeb80a162c57624b3ff80313fe69f5203e',
    reserves: [
      // hub asset addresses contained in the vault
      '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
      '0xb592d2631ccf245119532e025d11188cfadb6777',
    ] as const,
  },
  [SodaTokens.sodaNIBI.symbol]: {
    address: '0xc6c85287a8b173a509c2f198bb719a8a5a2d0c68',
    reserves: [
      // hub asset addresses contained in the vault
      '0xe0064414c2c1a636a9424c7a17d86fbf7fd3f190',
    ] as const,
  },
  [SodaTokens.sodaPOL.symbol]: {
    address: '0x208ed38f4783328aa9ebfec360d32e7520a9b779',
    reserves: [
      // hub asset addresses contained in the vault
      '0x9ee17486571917837210824b0d4cadfe3b324d12',
    ] as const,
  },
  [SodaTokens.bnUSD.symbol]: {
    // new bnUSD vault on Sonic (also contains IbnUSD vault token as part of it)
    address: '0xe801ca34e19abcbfea12025378d19c4fbe250131',
    reserves: [
      // hub asset addresses contained in the vault
      '0xabbb91c0617090f0028bdc27597cd0d038f3a833',
      '0xbdf1f453fcb61424011bbddcb96cfdb30f3fe876',
      '0x94dc79ce9c515ba4ae4d195da8e6ab86c69bfc38',
      '0x5ce6c1c51ff762cf3acd21396257046f694168b6',
      '0xdf5639d91359866f266b56d60d98ede9feedd100',
      '0x238384ae2b4f0ec189ecb5031859ba306b2679c5',
      '0x419ca9054e44e94ceab52846ecdc3997439bbca6',
      '0x18f85f9e80ff9496eebd5979a051af16ce751567',
      '0x289cda1043b4ce26bdca3c12e534f56b24308a5b',
      '0x23225ab8e63fca4070296678cb46566d57e1bbe3',
      '0x14c65b1cdc0b821569081b1f77342da0d0cbf439',
      '0xdf23097b9aeb917bf8fb70e99b6c528fffa35364',
      '0x11b93c162aabffd026539bb3b9f9ec22c8b7ef8a',
      '0x69425ffb14704124a58d6f69d510f74a59d9a5bc',
      '0x9d4b663eb075d2a1c7b8eaefb9eccc0510388b51',
      '0xD1d14BF3324C901855A1f7d0d5CA4c8458D2a780',
      '0x19feaf3043dfa69b365d05495630e840a2b9a9dc',
    ] as const,
  },
  [SodaTokens.sodaSODA.symbol]: {
    // SODA SODA vault
    address: '0x21685e341de7844135329914be6bd8d16982d834',
    reserves: [
      // hub asset addresses contained in the vault
      '0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963', // SODA SODA hub asset
      '0xf51d7082375cdca8C19C74e1A0c77dA482aFDa4e',
      '0x93a367E5B37a1B9E8D04ef25a6Af40d181a3DfFF',
      '0x17fF8Ad5EBe6CA8B15751067cD0c89f0E580CD17',
      '0x4d12c72A8633588097D10e57b559ed642588e4C6',
      '0x26cd76cB5622Dc8638670A16E0Da5a51394A8DB1',
      '0x0eD0d274dC77ef460DC96b9fBaFF3EDB074e0471',
      '0x8D78A620E009Ba751Eb40d77A5e9Db48A3F2016b',
      '0x4Cf5Ce9594AEDdc5D3efe9d4Cdf0b944b4e73A53',
      '0xD749B5FfFED7cEDaa3239abDd16D677179C29AEc',
      '0x07Db7b1a96ebE474B20F52fF487cEE415adee79e',
      '0x20Ce75CdcEe44B1308365447b91B9c26e2b71Ffd',
      '0x5Db9CEc919f40C50809D9490DC3BbA4F05b0a1D7',
      '0x655730024B673B3378CD6031B1Cd01eaE9afb138',
      '0x4cf5ce9594aeddc5d3efe9d4cdf0b944b4e73a53',
    ] as const,
  },
  [SodaTokens.sodaAVAX.symbol]: {
    // SODA AVAX vault
    address: '0x14238d267557e9d799016ad635b53cd15935d290',
    reserves: [
      // hub asset addresses contained in the vault
      '0xc9e4f0b6195f389d9d2b639f2878b7674eb9d8cd', // AvalancheAVAX hub asset
    ] as const,
  },
  [SodaTokens.sodaBNB.symbol]: {
    // SODA BNB vault
    address: '0x40cd41b35db9e5109ae7e54b44de8625db320e6b',
    reserves: [
      // hub asset addresses contained in the vault
      '0x13b70564b1ec12876b20fab5d1bb630311312f4f', // BSC BNB hub asset
    ] as const,
  },
  [SodaTokens.sodaETH.symbol]: {
    // SODA ETH vault
    address: '0x4effb5813271699683c25c734f4dabc45b363709',
    reserves: [
      // hub asset addresses contained in the vault
      '0x70178089842be7f8e4726b33f0d1569db8021faa', // BASE ETH hub asset
      '0xad332860dd3b6f0e63f4f66e9457900917ac78cd', // Optimism ETH hub asset
      '0xdcd9578b51ef55239b6e68629d822a8d97c95b86', // Arbitrum ETH hub asset
      '0x57fc2ac5701e463ae261adbd6c99fbeb48ce5293', // BSC ETH hub asset
      '0x50c42deacd8fc9773493ed674b675be577f2634b', // Sonic WETH hub asset
      '0x19920ef8fe1a9d51fdb0914abbb2f970c74dca68', // Lightlink ETH hub asset
    ] as const,
  },
  [SodaTokens.sodaBTC.symbol]: {
    // SODA BTC vault
    address: '0x7a1a5555842ad2d0ed274d09b5c4406a95799d5d',
    reserves: [
      // hub asset addresses contained in the vault
      '0x2803a23a3ba6b09e57d1c71dec0d9efdbb00a27f', // BASE cbBTC hub asset,
      '0xfb0acb1b2720b620935f50a6dd3f7fea52b2fcbe', // Arbitrum wBTC hub asset
      '0x96fc8540736f1598b7e235e6de8814062b3b5d3b', // Arbitrum tBTC hub asset,
      '0xd8a24c71fea5bb81c66c01e532de7d9b11e13905', // BSC BTCB hub asset
      '0x03E99853C6376b13a4c6e4d0A115F1639c9FA14e',
    ] as const,
  },
  [SodaTokens.sodaSUI.symbol]: {
    // SODA SUI vault
    address: '0xdc5b4b00f98347e95b9f94911213dab4c687e1e3',
    reserves: [
      // hub asset addresses contained in the vault
      '0x4676b2a551b25c04e235553c1c81019337384673', // SUI SUI hub asset
    ] as const,
  },
  [SodaTokens.sodaINJ.symbol]: {
    // SODA INJ vault
    address: '0x1f22279c89b213944b7ea41dacb0a868ddcdfd13',
    reserves: [
      // hub asset addresses contained in the vault
      '0xd375590b4955f6ea5623f799153f9b787a3bd319', // Injective INJ hub asset
    ] as const,
  },
  [SodaTokens.sodaXLM.symbol]: {
    // SODA XLM vault
    address: '0x6bc8c37cba91f76e68c9e6d689a9c21e4d32079b',
    reserves: [
      // hub asset addresses contained in the vault
      '0x8ac68af223907fb1b893086601a3d99e00f2fa9d', // Stellar XLM hub asset
    ] as const,
  },
  [SodaTokens.sodaSOL.symbol]: {
    // SODA SOL vault
    address: '0xdea692287e2ce8cb08fa52917be0f16b1dacdc87',
    reserves: [
      // hub asset addresses contained in the vault
      '0x0c09e69a4528945de6d16c7e469dea6996fdf636', // Solana SOL hub asset
    ] as const,
  },
  [SodaTokens.sodaUSDT.symbol]: {
    // SODA USDT vault
    address: '0xbdf1f453fcb61424011bbddcb96cfdb30f3fe876',
    reserves: [
      // hub asset addresses contained in the vault
      '0x41fd5c169e014e2a657b9de3553f7a7b735fe47a',
      '0xc168067d95109003805ac865ae556e8476dc69bc',
      '0x3c0a80c6a1110fc80309382b3989ec626c135ee9',
      '0x6047828dc181963ba44974801ff68e538da5eaf9', // Sonic USDT
    ] as const,
  },
  [SodaTokens.sodaUSDC.symbol]: {
    address: '0xabbb91c0617090f0028bdc27597cd0d038f3a833',
    reserves: [
      '0x41abf4b1559ff709ef8150079bcb26db1fffd117',
      '0x72e852545b024ddcbc5b70c1bcbdaa025164259c',
      '0xb7c213cbd24967de9838fa014668fddb338f724b',
      '0xdb7bda65c3a1c51d64dc4444e418684677334109',
      '0xa36893ba308b332fdebfa95916d1df3a2e3cf8b3',
      '0x29219dd400f2bf60e5a23d13be72b486d4038894',
      '0x5635369c8a29a081d26c2e9e28012fca548ba0cb',
      '0x3d73437dd81b3f9ec82752beb1752f03a8531710',
      '0x4bc1211faa06fb50ff61a70331f56167ae511057',
      '0x348007b53f25a9a857ab8ea81ec9e3ccbcf440f2',
      '0xc3f020057510ffe10ceb882e1b48238b43d78a5e',
      '0x9d58508ad10d34048a11640735ca5075bba07b35',
      '0xC1df02fb7b1b06bE886592C89F6955387998B2f7',
    ] as const,
  },
  [SodaTokens.sodaHYPE.symbol]: {
    address: '0x6e81124fc5d2bf666b16a0a5d90066ebf35c7411',
    reserves: ['0x7288622bc2d39553f34d5b81c88c3f979d91dbc7'],
  },
} as const satisfies Record<HubVaultSymbol, VaultType>;

export const hubVaultTokensMap: Map<string, Token> = new Map(
  Object.entries(hubVaults).map(([symbol, vault]) => [
    vault.address.toLowerCase(),
    {
      address: vault.address.toLowerCase(),
      symbol,
      name: symbol,
      decimals: 18,
    },
  ]),
);

export const getHubVaultTokenByAddress = (address: string): Token | undefined => {
  return hubVaultTokensMap.get(address.toLowerCase());
};

// bnUSD Migration configs
export const bnUSDLegacySpokeChainIds = [
  ICON_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
] as const;
export const newbnUSDSpokeChainIds = CHAIN_IDS.filter(chainId => chainId !== ICON_MAINNET_CHAIN_ID);
export const bnUSDLegacyTokens = [
  spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
  spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
] as const;
export const bnUSDNewTokens = newbnUSDSpokeChainIds.map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD);

export const isLegacybnUSDChainId = (chainId: SpokeChainId): boolean => {
  return bnUSDLegacySpokeChainIds.includes(chainId as LegacybnUSDChainId);
};

export const isNewbnUSDChainId = (chainId: SpokeChainId): boolean => {
  return newbnUSDSpokeChainIds.includes(chainId as NewbnUSDChainId);
};

export const isLegacybnUSDToken = (token: Token | string): boolean => {
  if (typeof token === 'string') {
    return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.toLowerCase());
  }

  return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase());
};

export const isNewbnUSDToken = (token: Token | string): boolean => {
  if (typeof token === 'string') {
    return newbnUSDSpokeChainIds
      .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
      .some(t => t.address.toLowerCase() === token.toLowerCase());
  }
  return newbnUSDSpokeChainIds
    .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
    .some(t => t.address.toLowerCase() === token.address.toLowerCase());
};

export const getAllLegacybnUSDTokens = (): { token: LegacybnUSDToken; chainId: LegacybnUSDChainId }[] => {
  return bnUSDLegacySpokeChainIds.map(chainId => ({
    token: spokeChainConfig[chainId].supportedTokens.legacybnUSD,
    chainId,
  }));
};

export const hubAssets: Record<
  SpokeChainId,
  Record<string, { asset: Address; decimal: number; vault: Address; symbol: string; name: string }>
> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].nativeToken]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wS.address,
      decimal: 18,
      symbol: 'S',
      name: 'Sonic',
      vault: hubVaults.sodaS.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].bnUSD]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].bnUSD,
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wS.address]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wS.address,
      decimal: 18,
      symbol: 'wS',
      name: 'Sonic',
      vault: hubVaults.sodaS.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH.address]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH.address,
      decimal: 18,
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC.address,
      decimal: 6,
      symbol: 'USDC ',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT.address,
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: hubVaults.sodaUSDT.address,
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.SODA.address,
      decimal: 18,
      symbol: 'SODA',
      name: 'SODA',
      vault: hubVaults.sodaSODA.address,
    },
    ...SodaTokensAsHubAssets,
  },
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xc9e4f0B6195F389D9d2b639f2878B7674eB9D8cD',
      decimal: 18,
      symbol: 'AVAX',
      name: 'AVAX',
      vault: hubVaults.sodaAVAX.address,
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0x41Fd5c169e014e2A657B9de3553f7a7b735Fe47A',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: hubVaults.sodaUSDT.address,
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x41abF4B1559FF709Ef8150079BcB26DB1Fffd117',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x289cDa1043b4Ce26BDCa3c12E534f56b24308A5B',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0xf51d7082375cdca8C19C74e1A0c77dA482aFDa4e',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xdcd9578b51ef55239b6e68629d822a8d97c95b86',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC.address]: {
      asset: '0xfB0ACB1b2720B620935F50a6dd3F7FEA52b2FCBe',
      decimal: 8,
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      vault: hubVaults.sodaBTC.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0x08D5cf039De35627fD5C0f48B8AF4a1647a462E8',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x2D5A7837D68b0c2CC4b14C2af2a1F0Ef420DDDc5',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC.address]: {
      asset: '0x96Fc8540736f1598b7E235e6dE8814062b3b5d3B',
      decimal: 18,
      symbol: 'tBTC',
      name: 'Arbitrum tBTC',
      vault: hubVaults.sodaBTC.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0x3C0a80C6a1110fC80309382b3989eC626c135eE9',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: hubVaults.sodaUSDT.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xdB7BdA65c3a1C51D64dC4444e418684677334109',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x419cA9054E44E94ceAb52846eCdC3997439BBcA6',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x93a367E5B37a1B9E8D04ef25a6Af40d181a3DfFF',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [BASE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x70178089842be7f8e4726b33f0d1569db8021faa',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC.address]: {
      asset: '0x2803a23a3BA6b09e57D1c71deC0D9eFdBB00A27F',
      decimal: 8,
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      vault: hubVaults.sodaBTC.address,
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x72E852545B024ddCbc5b70C1bCBDAA025164259C',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDF5639D91359866f266b56D60d98edE9fEEDd100',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0x55e0ad45eb97493b3045eee417fb6726cb85dfd4',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x494aaeaefdf5964d4ed400174e8c5b98c00957aa',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x17fF8Ad5EBe6CA8B15751067cD0c89f0E580CD17',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xad332860dd3b6f0e63f4f66e9457900917ac78cd',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x238384AE2b4F0EC189ecB5031859bA306B2679c5',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xb7C213CbD24967dE9838fa014668FDDB338f724B',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x61e26f611090CdC6bc79A7Bf156b0fD10f1fC212',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0xE121c0Dc2B33c00ff31ee3D902D248cc3f19Ea50',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0xc168067d95109003805aC865ae556e8476DC69bc',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: hubVaults.sodaUSDT.address,
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x0eD0d274dC77ef460DC96b9fBaFF3EDB074e0471',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [NIBIRU_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xe0064414c2c1a636a9424C7a17D86fbF7FD3f190',
      decimal: 18,
      symbol: 'NIBI',
      name: 'Nibiru',
      vault: hubVaults.sodaNIBI.address,
    },
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x11b93C162aABFfD026539bb3B9F9eC22c8b7ef8a',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x26cd76cB5622Dc8638670A16E0Da5a51394A8DB1',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [BSC_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x13b70564b1ec12876b20fab5d1bb630311312f4f',
      decimal: 18,
      symbol: 'BNB',
      name: 'BNB',
      vault: hubVaults.sodaBNB.address,
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB.address]: {
      asset: '0x57fC2aC5701e463ae261AdBd6C99FBeB48Ce5293',
      decimal: 18,
      symbol: 'ETHB',
      name: 'Wrapped Ethereum',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB.address]: {
      asset: '0xD8A24c71FEa5bB81c66C01e532dE7d9B11e13905',
      decimal: 18,
      symbol: 'BTCB',
      name: 'Wrapped Bitcoin',
      vault: hubVaults.sodaBTC.address,
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x5Ce6C1c51ff762cF3acD21396257046f694168b6',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x9d58508ad10d34048a11640735ca5075bba07b35',
      decimal: 18,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x4d12c72A8633588097D10e57b559ed642588e4C6',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [POLYGON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x9ee17486571917837210824b0d4cadfe3b324d12',
      decimal: 18,
      symbol: 'MATIC',
      name: 'Polygon',
      vault: hubVaults.sodaPOL.address,
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x18f85f9E80ff9496EeBD5979a051AF16Ce751567',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xa36893ba308b332FDEbfa95916D1dF3a2e3CF8B3',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x8D78A620E009Ba751Eb40d77A5e9Db48A3F2016b',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [HYPEREVM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x7288622bc2D39553f34D5b81c88c3F979d91dbc7',
      decimal: 18,
      symbol: 'HYPE',
      name: 'HYPE',
      vault: hubVaults.sodaHYPE.address,
    },
    [spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x19feaf3043dfa69b365d05495630e840a2b9a9dc',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x4cf5ce9594aeddc5d3efe9d4cdf0b944b4e73a53',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [LIGHTLINK_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x19920ef8fe1a9d51fdb0914abbb2f970c74dca68',
      decimal: 18,
      symbol: 'ETH',
      name: 'ETH',
      vault: hubVaults.sodaETH.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x14ab2ab7a76838b9205488efc3f700d0632ce8c7',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0xe4faab621fb6716e32057b7ea7356219936519ac',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xe5159e2a89aeec2fc63d6c25adda3541670af101',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['BTC.LL'].address]: {
      asset: '0x54582cdb0c145398b532e34f0851ffc1bbc88b4e',
      decimal: 18,
      symbol: 'BTC.LL',
      name: 'Bitcoin LightLink',
      vault: hubVaults.sodaBTC.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['AVAX.LL'].address]: {
      asset: '0x415ff3ea8c905ef65cd82665c5534d0e4ff9221a',
      decimal: 18,
      symbol: 'AVAX.LL',
      name: 'Avalanche LightLink',
      vault: hubVaults.sodaAVAX.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['BNB.LL'].address]: {
      asset: '0xd32e524da9d64db4c37a50f1ee197b591e97dc05',
      decimal: 18,
      symbol: 'BNB.LL',
      name: 'BNB LightLink',
      vault: hubVaults.sodaBNB.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SOL.LL'].address]: {
      asset: '0xd70c16f1e2c4207dc4c44bc69c8a1b82b50cf9e2',
      decimal: 18,
      symbol: 'SOL.LL',
      name: 'Solana LightLink',
      vault: hubVaults.sodaSOL.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['XLM.LL'].address]: {
      asset: '0x18008b18964bc2c90521a7596ff9988743c97fd4',
      decimal: 18,
      symbol: 'XLM.LL',
      name: 'Stellar LightLink',
      vault: hubVaults.sodaXLM.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['INJ.LL'].address]: {
      asset: '0xb036daab0c772b080babb84b8695c3ca858925b6',
      decimal: 18,
      symbol: 'INJ.LL',
      name: 'Injective LightLink',
      vault: hubVaults.sodaINJ.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SUI.LL'].address]: {
      asset: '0x425852cca84e5f44d7b8ebb964b21bde585b4571',
      decimal: 18,
      symbol: 'SUI.LL',
      name: 'Sui LightLink',
      vault: hubVaults.sodaSUI.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['S.LL'].address]: {
      asset: '0xb592d2631ccf245119532e025d11188cfadb6777',
      decimal: 18,
      symbol: 'S.LL',
      name: 'Sonic LightLink',
      vault: hubVaults.sodaS.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['POL.LL'].address]: {
      asset: '0x15ba35f87f259b9b50d53a2fec271bb10020b090',
      decimal: 18,
      symbol: 'POL.LL',
      name: 'Polygon LightLink',
      vault: hubVaults.sodaPOL.address,
    },
    [spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['HYPE.LL'].address]: {
      asset: '0xea7e97b4597f724844426c32248ba80bd29c75f8',
      decimal: 18,
      symbol: 'HYPE.LL',
      name: 'HyperEVM LightLink',
      vault: hubVaults.sodaHYPE.address,
    },
  },
  [INJECTIVE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ.address]: {
      asset: '0xd375590b4955f6ea5623f799153f9b787a3bd319',
      decimal: 18,
      symbol: 'INJ',
      name: 'Injective',
      vault: hubVaults.sodaINJ.address,
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x69425FFb14704124A58d6F69d510f74A59D9a5bC',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x4bc1211faa06fb50ff61a70331f56167ae511057',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x20Ce75CdcEe44B1308365447b91B9c26e2b71Ffd',
      decimal: 18,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [STELLAR_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x8ac68af223907fb1b893086601a3d99e00f2fa9d',
      decimal: 7,
      symbol: 'XLM',
      name: 'Stellar Lumens',
      vault: hubVaults.sodaXLM.address,
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x23225Ab8E63FCa4070296678cb46566d57E1BBe3',
      decimal: 7,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x348007B53F25A9A857aB8eA81ec9E3CCBCf440f2',
      decimal: 7,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD.address]: {
      asset: '0x1559b52d2e165da1505a542ea37c543c9137f52a',
      decimal: 18,
      symbol: 'legacybnUSD',
      name: 'legacybnUSD',
      vault: hubVaults.IbnUSD.address,
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0xD749B5FfFED7cEDaa3239abDd16D677179C29AEc',
      decimal: 7,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [SUI_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x4676b2a551b25c04e235553c1c81019337384673',
      decimal: 9,
      symbol: 'SUI',
      name: 'Sui',
      vault: hubVaults.sodaSUI.address,
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDf23097B9AEb917Bf8fb70e99b6c528fffA35364',
      decimal: 9,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x5635369c8a29A081d26C2e9e28012FCa548BA0Cb',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.afSUI.address]: {
      asset: '0x039666bd0cbc96a66c40e8541af465beaa81aa7e',
      decimal: 9,
      symbol: 'afSUI',
      name: 'afSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.mSUI.address]: {
      asset: '0xb202c674c9a79b5681e981ba0daa782b3ceeebbe',
      decimal: 9,
      symbol: 'mSUI',
      name: 'mSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.haSUI.address]: {
      asset: '0x67a26d11fce15e8b33ac97230d36cae1c52c35e7',
      decimal: 9,
      symbol: 'haSUI',
      name: 'haSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.vSUI.address]: {
      asset: '0x025715bcda08db06c795cd5bf944e2081468d99a',
      decimal: 9,
      symbol: 'vSUI',
      name: 'vSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.yapSUI.address]: {
      asset: '0xac509404f3a3ca3f7766baf65be45a52b1cfccd7',
      decimal: 9,
      symbol: 'yapSUI',
      name: 'yapSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.trevinSUI.address]: {
      asset: '0x514569c788b096595672e0f68ec72387a22ac67b',
      decimal: 9,
      symbol: 'trevinSUI',
      name: 'trevinSUI',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD.address]: {
      asset: '0xddf6ad38f9c9451c1f4cdf369040f6869e37393e',
      decimal: 9,
      symbol: 'bnUSD',
      name: 'legacybnUSD',
      vault: hubVaults.IbnUSD.address,
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x5Db9CEc919f40C50809D9490DC3BbA4F05b0a1D7',
      decimal: 9,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [SOLANA_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL.address]: {
      asset: '0x0c09e69a4528945de6d16c7e469dea6996fdf636',
      decimal: 9,
      symbol: 'SOL',
      name: 'Solana',
      vault: hubVaults.sodaSOL.address,
    },
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x14C65b1CDc0B821569081b1F77342dA0D0CbF439',
      decimal: 9,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.bnUSD.address,
    },
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xC3f020057510ffE10Ceb882e1B48238b43d78a5e',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: hubVaults.sodaUSDC.address,
    },
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SODA.address]: {
      asset: '0x07Db7b1a96ebE474B20F52fF487cEE415adee79e',
      decimal: 9,
      symbol: 'SODA',
      name: 'SODAX',
      vault: hubVaults.sodaSODA.address,
    },
  },
  [ICON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      symbol: 'ICX',
      name: 'ICON',
      vault: '0x', // no vault yet
    },
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].addresses.wICX]: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      symbol: 'wICX',
      name: 'ICON',
      vault: '0x',
    },
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x654dddf32a9a2ac53f5fb54bf1e93f66791f8047',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: hubVaults.IbnUSD.address,
    },
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.BALN.address]: {
      asset: '0xde8e19a099fedf9d617599f62c5f7f020d92b572',
      decimal: 18,
      symbol: 'BALN',
      name: 'BALN',
      vault: '0x', // no vault yet
    },
  },
} as const;

export const DEFAULT_RELAYER_API_ENDPOINT = 'https://xcall-relay.nw.iconblockchain.xyz';

const solverConfig = {
  [SONIC_MAINNET_CHAIN_ID]: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://sodax-solver.iconblockchain.xyz',
  } satisfies SolverConfig,
};

export const getSolverConfig = (chainId: HubChainId): SolverConfig => solverConfig[chainId];

// currently supported spoke chain tokens for solver
const solverSupportedTokens: Record<SpokeChainId, readonly Token[]> = {
  [SONIC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.S,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wS,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const satisfies Token[],
  [AVALANCHE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.AVAX,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const satisfies Token[],
  [ARBITRUM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT,
  ] as const satisfies Token[],
  [BASE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC,
  ] as const satisfies Token[],
  [OPTIMISM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    // spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH, // NOTE: Not Implemented
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT,
  ] as const satisfies Token[],
  [POLYGON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.POL,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [BSC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BNB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [HYPEREVM_MAINNET_CHAIN_ID]: [] as const satisfies Token[],
  [LIGHTLINK_MAINNET_CHAIN_ID]: [
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    // spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.SODA,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['BTC.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['AVAX.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['BNB.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SOL.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['XLM.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['INJ.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SUI.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['S.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['POL.LL'],
    // spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['HYPE.LL'],
  ] as const satisfies Token[],
  [SOLANA_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [ICON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.wICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    // spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.BALN, // NOTE: Not Implemented
    // spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.OMM, // NOTE: Not Implemented
  ] as const satisfies Token[],
  [STELLAR_MAINNET_CHAIN_ID]: [
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.XLM,
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [SUI_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.afSUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.mSUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.haSUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.vSUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.yapSUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.trevinSUI,
  ] as const satisfies Token[],
  [INJECTIVE_MAINNET_CHAIN_ID]: [
    // spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ,
    // spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.bnUSD, // NOTE: Not Implemented
    // spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [NIBIRU_MAINNET_CHAIN_ID]: [
    // spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].supportedTokens.NIBI, // NOTE: Not Implemented
    // spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].supportedTokens.bnUSD, // NOTE: Not Implemented
    // spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].supportedTokens.USDC, // NOTE: Not Implemented
  ] as const satisfies Token[],
} as const;

// get supported spoke chain tokens for solver
export const getSupportedSolverTokens = (chainId: SpokeChainId): readonly Token[] => solverSupportedTokens[chainId];

// check if token address for given spoke chain id is supported
export const isSolverSupportedToken = (chainId: SpokeChainId, token: string): boolean =>
  solverSupportedTokens[chainId].some(t => t.address.toLowerCase() === token.toLowerCase());

const moneyMarketConfig = {
  [SONIC_MAINNET_CHAIN_ID]: {
    lendingPool: '0x553434896D39F867761859D0FE7189d2Af70514E',
    uiPoolDataProvider: '0xC04d746C38f1E51C8b3A3E2730250bbAC2F271bf',
    poolAddressesProvider: '0x036aDe0aBAA4c82445Cb7597f2d6d6130C118c7b',
    bnUSD: '0x94dC79ce9C515ba4AE4D195da8E6AB86c69BFc38',
    bnUSDVault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  } satisfies MoneyMarketConfig,
} as const;

export const getMoneyMarketConfig = (chainId: HubChainId): MoneyMarketConfig => moneyMarketConfig[chainId];

const concentratedLiquidityConfig = {
  permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  clPoolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43',
  router: '0x5bFB058c65E4c1DEC1cFF0Ff2cBd8522b4c3feBB',
  clPositionManager: '0xcc08a04d9E5766c7A20FE6bb32cAa40EA0e7e9e1',
  clPositionDescriptor: '0x83Ff9FC474DBe927BA5BB822571e0814122655bB',
  clQuoter: '0x5f46CB668D39496b41CE8E19D6A7fE893826E363',
  clTickLens: '0xb3e77dD9b1f206A2b797B3fE900b50cC92A38d26',
  defaultHook: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229',
  stataTokenFactory: '0x9120956787FcE7D7082C52CDCAafb7F4B88272d4',
  defaultTickSpacing: 10,
  defaultBitmap: 16383n,
} as const satisfies ConcentratedLiquidityConfig;

export const getConcentratedLiquidityConfig = (): ConcentratedLiquidityConfig => concentratedLiquidityConfig;

// currently supported spoke chain tokens for money market
export const moneyMarketSupportedTokens = {
  [AVALANCHE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.AVAX,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [ARBITRUM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC,
    // spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    // spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [BASE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    // spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    // spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [OPTIMISM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    // spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    // spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [POLYGON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.POL,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [BSC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BNB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [HYPEREVM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].supportedTokens.HYPE,
    spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[HYPEREVM_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [LIGHTLINK_MAINNET_CHAIN_ID]: [
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['AVAX.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['BNB.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SOL.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['XLM.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['INJ.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['SUI.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['S.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['POL.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens['HYPE.LL'],
    spokeChainConfig[LIGHTLINK_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [SOLANA_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [ICON_MAINNET_CHAIN_ID]: [
    // spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    // spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.wICX,
  ] as const,
  [STELLAR_MAINNET_CHAIN_ID]: [
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.XLM,
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [SUI_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [INJECTIVE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
  [NIBIRU_MAINNET_CHAIN_ID]: [] as const,
  [SONIC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.S,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wS,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.SODA,
  ] as const,
} as const satisfies Record<SpokeChainId, Readonly<Token[]>>;

export const migrationConfig = {
  bnUSD: {
    [ICON_MAINNET_CHAIN_ID]: {
      legacybnUSD: spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
      newbnUSD: hubVaults.bnUSD.address,
    },
    [SUI_MAINNET_CHAIN_ID]: {
      legacybnUSD: spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
      newbnUSD: hubVaults.bnUSD.address,
    },
    [STELLAR_MAINNET_CHAIN_ID]: {
      legacybnUSD: spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
      newbnUSD: hubVaults.bnUSD.address,
    },
  },
  ICX: {
    [ICON_MAINNET_CHAIN_ID]: {
      icx: spokeChainConfig[ICON_MAINNET_CHAIN_ID]['nativeToken'],
      wICX: spokeChainConfig[ICON_MAINNET_CHAIN_ID]['addresses']['wICX'],
    },
  },
} as const;

export const dexPools = {
  AETH_BNUSD: {
    currency0: '0x3E102c7D9b46c92aBcd4c2e1C70f362B47a201A6', // AsodaETH
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // bnuSD
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  BTC_BNUSD: {
    currency0: '0x8aDe79C255761971f4057253712b916AB2494275', // sodaBTC
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // bnUSD
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  // SODA/ETH pool
  ASODA_BNUSD: {
    currency0: '0xac8540fee419c7ceb985889EaBa1e84B42a53e8a', // sodaSODA
    currency1: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // sodaETH
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },

  // SODA/USDC pool
  ASODA_XSODA: {
    currency0: '0xac8540fee419c7ceb985889EaBa1e84B42a53e8a', // sodaSODA
    currency1: '0xADC6561Cc8FC31767B4917CCc97F510D411378d9', // xSODA
    hooks: '0x598448d8f8553b9c6f27E52a92E2cCf27cDEF229', // defaultHook
    poolManager: '0xA3256ab552A271A16AcDfdB521B32ef82d481F43', // clPoolManager
    fee: 8388608, // DYNAMIC_FEE
    parameters: {
      tickSpacing: 10,
      hooksRegistration: {
        beforeInitialize: true,
        afterInitialize: true,
        beforeAddLiquidity: true,
        afterAddLiquidity: true,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: true,
        beforeSwap: true,
        afterSwap: true,
        beforeDonate: true,
        afterDonate: true,
        beforeSwapReturnsDelta: true,
        afterSwapReturnsDelta: true,
        afterMintReturnsDelta: true,
        afterBurnReturnsDelta: true,
      },
    },
  },
} as const satisfies Record<string, PoolKey>;

export const StatATokenAddresses = {
  '0xac8540fee419c7ceb985889eaba1e84b42a53e8a': '0x21685E341DE7844135329914Be6Bd8D16982d834',
  '0x8ade79c255761971f4057253712b916ab2494275': '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
  '0x3e102c7d9b46c92abcd4c2e1c70f362b47a201a6': '0x4effB5813271699683C25c734F4daBc45B363709',
} as const satisfies Record<Address, Address>;

export const getOriginalAssetAddressFromStakedATokenAddress = (
  chainId: SpokeChainId,
  address: Address,
): OriginalAssetAddress => {
  const normalizedAddress = address.toLowerCase() as keyof typeof StatATokenAddresses;
  const sodaToken = StatATokenAddresses[normalizedAddress] ?? address;
  const originalAssetAddresses = getOriginalAssetInfoFromVault(chainId, sodaToken);
  if (!originalAssetAddresses.length) {
    throw new Error('[getOriginalAssetAddressFromStakedATokenAddress] Original asset address not found');
  }
  return originalAssetAddresses[0] as OriginalAssetAddress;
};

export const isMoneyMarketSupportedToken = (chainId: SpokeChainId, token: string): boolean =>
  moneyMarketSupportedTokens[chainId].some(t => t.address.toLowerCase() === token.toLowerCase());

// get supported spoke chain tokens for money market
export const getSupportedMoneyMarketTokens = (chainId: SpokeChainId): readonly Token[] =>
  moneyMarketSupportedTokens[chainId];

export const hubVaultsAddressSet = new Set<Address>(
  Object.values(hubVaults).map(vault => vault.address.toLowerCase() as Address),
);

// all hub assets contained in the money market reserves (supply / borrow assets)
export const moneyMarketReserveHubAssetsSet = new Set<Address>(
  Object.values(hubVaults).flatMap(vault => vault.reserves.map(reserve => reserve.toLowerCase() as Address)),
);

export const isMoneyMarketReserveHubAsset = (hubAsset: Address): boolean =>
  moneyMarketReserveHubAssetsSet.has(hubAsset.toLowerCase() as Address);

export const moneyMarketReserveAssets = [
  ...Object.values(hubVaults).map(vault => vault.address),
  getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault,
] as const;

export const isMoneyMarketReserveAsset = (asset: Address): boolean =>
  moneyMarketReserveAssets.map(a => a.toLowerCase()).includes(asset.toLowerCase());

export const originalAssetTohubAssetMap: Map<SpokeChainId, Map<OriginalAssetAddress, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
  ]),
);
export const hubAssetToOriginalAssetMap: Map<SpokeChainId, Map<Address, OriginalAssetAddress>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
  ]),
);
export const chainIdToHubAssetsMap: Map<SpokeChainId, Map<Address, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([, info]) => [info.asset.toLowerCase() as Address, info])),
  ]),
);
export const supportedHubAssets: Set<Address> = new Set(
  Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.asset.toLowerCase() as Address)),
);
export const supportedSodaAssets: Set<Address> = new Set(
  Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.vault.toLowerCase() as Address)),
);
export const spokeChainIdsSet = new Set(CHAIN_IDS);

// Returns the first hub asset info for a given chainId whose vault address matches the provided vault address (case-insensitive)
export const getOriginalAssetInfoFromVault = (chainId: SpokeChainId, vault: Address): OriginalAssetAddress[] => {
  const assets = hubAssets[chainId];
  if (!assets) {
    return [];
  }
  const vaultAddress = vault.toLowerCase();
  const result: OriginalAssetAddress[] = [];
  for (const [spokeToken, info] of Object.entries(assets)) {
    if (info.vault.toLowerCase() === vaultAddress) {
      result.push(spokeToken);
    }
  }
  return result;
};
export const getHubAssetInfo = (chainId: SpokeChainId, asset: OriginalAssetAddress): HubAssetInfo | undefined =>
  originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
export const isValidOriginalAssetAddress = (chainId: SpokeChainId, asset: OriginalAssetAddress): boolean =>
  originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
export const getOriginalAssetAddress = (chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined =>
  hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
export const getOriginalTokenFromOriginalAssetAddress = (
  chainId: SpokeChainId,
  asset: OriginalAssetAddress,
): XToken | undefined =>
  Object.values(spokeChainConfig[chainId].supportedTokens).find(t => t.address.toLowerCase() === asset.toLowerCase()) ??
  undefined;
export const isValidHubAsset = (hubAsset: Address): boolean =>
  supportedHubAssets.has(hubAsset.toLowerCase() as Address);
export const isValidVault = (vault: Address): boolean => supportedSodaAssets.has(vault.toLowerCase() as Address);
export const isValidChainHubAsset = (chainId: SpokeChainId, hubAsset: Address): boolean =>
  chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
export const isValidSpokeChainId = (chainId: SpokeChainId): boolean => spokeChainIdsSet.has(chainId);
export const isValidIntentRelayChainId = (chainId: bigint): boolean =>
  Object.values(ChainIdToIntentRelayChainId).some(id => id === chainId);
export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig) as HubChainId[];
export const supportedSpokeChains: SpokeChainId[] = Object.keys(spokeChainConfig) as SpokeChainId[];
export const intentRelayChainIdToSpokeChainIdMap: Map<IntentRelayChainId, SpokeChainId> = new Map(
  Object.entries(ChainIdToIntentRelayChainId).map(([chainId, intentRelayChainId]) => [
    intentRelayChainId,
    chainId as SpokeChainId,
  ]),
);
export const supportedTokensPerChain: Map<SpokeChainId, readonly XToken[]> = new Map(
  Object.entries(spokeChainConfig).map(([chainId, config]) => [
    chainId as SpokeChainId,
    Object.values(config.supportedTokens),
  ]),
);

export const getSpokeChainIdFromIntentRelayChainId = (intentRelayChainId: IntentRelayChainId): SpokeChainId => {
  const spokeChainId = intentRelayChainIdToSpokeChainIdMap.get(intentRelayChainId);
  if (!spokeChainId) {
    throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
  }
  return spokeChainId;
};
export const isNativeToken = (chainId: SpokeChainId, token: Token | string): boolean => {
  if (typeof token === 'string') {
    return token.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
  }

  return token.address.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
};
