import type { Address, Chain } from 'viem';
import { arbitrum, avalanche, base, bsc, nibiru, optimism, polygon, sonic } from 'viem/chains';
import type {
  CosmosSpokeChainConfig,
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
  SPOKE_CHAIN_IDS,
  NEAR_MAINNET_CHAIN_ID,
} from '@sodax/types';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RELAY_TX_TIMEOUT = 60000; // 60 seconds
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;
export const MAX_UINT256 = (1n << 256n) - 1n;
export const FEE_PERCENTAGE_SCALE = 10000n; // 100% = 10000

export const VAULT_TOKEN_DECIMALS = 18;

// NOTE: This is not the same as the actual chain ids (wormhole based ids), only used for intent relay
export const INTENT_RELAY_CHAIN_IDS = {
  AVAX: 6n,
  SUI: 21n,
  SONIC: 146n,
  STELLAR: 27n,
  INJ: 19n,
  SOL: 1n,
  ICON: 1768124270n,
  BASE: 30n,
  BINANCE: 4n,
  OPTIMISM: 24n,
  POLYGON: 5n,
  ARBITRUM: 23n,
  NIBIRU: 7235938n,
  NEAR:15n
} as const;

export const EVM_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const EVM_SPOKE_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
] as const;

const ChainIdToIntentRelayChainId: Record<ChainId, IntentRelayChainId> = {
  [AVALANCHE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.AVAX,
  [ARBITRUM_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ARBITRUM,
  [BASE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.BASE,
  [BSC_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.BINANCE,
  [INJECTIVE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.INJ,
  [SONIC_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SONIC,
  [OPTIMISM_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.OPTIMISM,
  [POLYGON_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.POLYGON,
  [SOLANA_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SOL,
  [SUI_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SUI,
  [STELLAR_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.STELLAR,
  [ICON_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ICON,
  [NIBIRU_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.NIBIRU,
  [NEAR_MAINNET_CHAIN_ID]:INTENT_RELAY_CHAIN_IDS.NEAR
};

export const getIntentRelayChainId = (chainId: ChainId): IntentRelayChainId => ChainIdToIntentRelayChainId[chainId];

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
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

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
      icxMigration: '0x8Af7cae2c8377BEDD8820A5ad096AaFA29D839cc',
      sodaToken: '0x8515352CB9832D1d379D52366D1E995ADd358420',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
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
    bnUSD: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
    supportedTokens: {
      Sonic: {
        symbol: 'Sonic',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x6047828dc181963ba44974801FF68e538dA5eaF9',
      },
      wSonic: {
        symbol: 'wSonic',
        name: 'Wrapped Sonic',
        decimals: 18,
        address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
      },
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 9,
        address: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      },
    },
    gasPrice: '500000',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'https://api.mainnet-beta.solana.com',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x043fb7e23350Dd5b77dE5E228B528763DEcb9131',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xA256dd181C3f6E5eC68C6869f5D50a712d47212e',
      },
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
      },
      tBTC: {
        symbol: 'tBTC',
        name: 'Arbitrum tBTC v2',
        decimals: 18,
        address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
      },
      WBTC: {
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 8,
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin (USDC)',
        decimals: 6,
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      },
      USDT: {
        symbol: 'USDT',
        name: 'TetherToken',
        decimals: 6,
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa',
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
      },
      cbBTC: {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        decimals: 8,
        address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      },
      wstETH: {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
      },
      weETH: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF',
      },
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x8428FedC020737a5A2291F46cB1B80613eD71638',
      },
      ETHB: {
        symbol: 'ETHB',
        name: 'Ethereum BSC',
        decimals: 18,
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      },
      BTCB: {
        symbol: 'BTCB',
        name: 'Bitcoin BSC',
        decimals: 18,
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 18,
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/bnUSD',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: 'ibc/2CBC2EA121AE42563B08028466F37B600F2D7D4282342DE938283CC3FB2BC00E',
      },
    },
    gasPrice: '500000000inj',
    network: 'Mainnet',
    prefix: 'inj',
    isBrowser: false,
    rpcUrl: 'https://injective-rpc.publicnode.com:443',
    walletAddress: '',
  } as const satisfies CosmosSpokeChainConfig,
  [STELLAR_MAINNET_CHAIN_ID]: {
    addresses: {
      connection: 'CDFQDDPUPAM3XPGORHDOEFRNLMKOH3N3X6XTXNLSXJQXIU3RVCM3OPEP',
      assetManager: 'CCGF33A4CO6D3BXFEKPXVCFCZBK76I3AQOZK6KIKRPAWAZR3632WHCJ3',
      xTokenManager: '',
      rateLimit: 'CB6G3ULISTTBPXUN3BI6ADHQGWJEN7BPQINHL45TCB6TDFM5QWU24HAY',
      testToken: '',
    },
    supportedTokens: {
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 7,
        address: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
      },
      XLM: {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        decimals: 7,
        address: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 7,
        address: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      },
    },
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA' as const,
    bnUSD: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
    rpc_url: 'https://rpc.ankr.com/stellar_soroban',
    chain: {
      name: 'soroban-mainnet',
      id: STELLAR_MAINNET_CHAIN_ID,
      type: 'STELLAR',
    },
  } as const satisfies StellarSpokeChainConfig,
  [SUI_MAINNET_CHAIN_ID]: {
    addresses: {
      connection:
        '0xf3b1e696a66d02cb776dc15aae73c68bc8f03adcb6ba0ec7f6332d9d90a6a3d2::connectionv3::0x3ee76d13909ac58ae13baab4c9be5a5142818d9a387aed641825e5d4356969bf',
      assetManager:
        '0x897f911a4b7691870a1a2513af7e85fdee8de275615c77068fd8b90b8e78c678::asset_manager::0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
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
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 9,
        address: '0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD',
      },
      USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
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
      name: 'ICON Mainnet',
      type: 'ICON',
    },
    supportedTokens: {
      ICX: {
        symbol: 'ICX',
        name: 'ICON',
        decimals: 18,
        address: 'cx0000000000000000000000000000000000000000',
      },
      wICX: {
        symbol: 'wICX',
        name: 'Wrapped ICX',
        decimals: 18,
        address: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
      },
      bnUSD: {
        symbol: 'bnUSD',
        name: 'bnUSD',
        decimals: 18,
        address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
      },
    } as const,
    nativeToken: 'cx0000000000000000000000000000000000000000' as const,
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    nid: '0x1',
  } as const satisfies IconSpokeChainConfig,
  [NEAR_MAINNET_CHAIN_ID]:{
    nativeToken:"",
    supportedTokens:[],
  },
} as const;

export const hubAssets: Record<
  SpokeChainId,
  Record<Address | string, { asset: Address; decimal: number; vault: Address; symbol: string; name: string }>
> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
      decimal: 18,
      symbol: 'S',
      name: 'Sonic',
      vault: '0x62ecc3Eeb80a162c57624B3fF80313FE69f5203e',
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wSonic.address]: {
      asset: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
      decimal: 18,
      symbol: 'wSonic',
      name: 'Sonic',
      vault: '0x62ecc3Eeb80a162c57624B3fF80313FE69f5203e',
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH.address]: {
      asset: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
      decimal: 18,
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
      decimal: 6,
      symbol: 'USDC ',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0x6047828dc181963ba44974801ff68e538da5eaf9',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },
  },
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xc9e4f0B6195F389D9d2b639f2878B7674eB9D8cD',
      decimal: 18,
      symbol: 'AVAX',
      name: 'AVAX',
      vault: '0x14238D267557E9d799016ad635B53CD15935d290',
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0x41Fd5c169e014e2A657B9de3553f7a7b735Fe47A',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x41abF4B1559FF709Ef8150079BcB26DB1Fffd117',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x289cDa1043b4Ce26BDCa3c12E534f56b24308A5B',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xdcd9578b51ef55239b6e68629d822a8d97c95b86',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC.address]: {
      asset: '0xfB0ACB1b2720B620935F50a6dd3F7FEA52b2FCBe',
      decimal: 8,
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0x08D5cf039De35627fD5C0f48B8AF4a1647a462E8',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x2D5A7837D68b0c2CC4b14C2af2a1F0Ef420DDDc5',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC.address]: {
      asset: '0x96Fc8540736f1598b7E235e6dE8814062b3b5d3B',
      decimal: 18,
      symbol: 'tBTC',
      name: 'Arbitrum tBTC',
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0x3C0a80C6a1110fC80309382b3989eC626c135eE9',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xdB7BdA65c3a1C51D64dC4444e418684677334109',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x419cA9054E44E94ceAb52846eCdC3997439BBcA6',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [BASE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x70178089842be7f8e4726b33f0d1569db8021faa',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC.address]: {
      asset: '0x2803a23a3BA6b09e57D1c71deC0D9eFdBB00A27F',
      decimal: 8,
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x72E852545B024ddCbc5b70C1bCBDAA025164259C',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDF5639D91359866f266b56D60d98edE9fEEDd100',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0x55e0ad45eb97493b3045eee417fb6726cb85dfd4',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x494aaeaefdf5964d4ed400174e8c5b98c00957aa',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
  },
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xad332860dd3b6f0e63f4f66e9457900917ac78cd',
      decimal: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x238384AE2b4F0EC189ecB5031859bA306B2679c5',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xb7C213CbD24967dE9838fa014668FDDB338f724B',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH.address]: {
      asset: '0x61e26f611090CdC6bc79A7Bf156b0fD10f1fC212',
      decimal: 18,
      symbol: 'wstETH',
      name: 'Wrapped Staked Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH.address]: {
      asset: '0xE121c0Dc2B33c00ff31ee3D902D248cc3f19Ea50',
      decimal: 18,
      symbol: 'weETH',
      name: 'Wrapped eETH',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT.address]: {
      asset: '0xc168067d95109003805aC865ae556e8476DC69bc',
      decimal: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },
  },
  [NIBIRU_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xe0064414c2c1a636a9424C7a17D86fbF7FD3f190',
      decimal: 18,
      symbol: 'NIBI',
      name: 'Nibiru',
      vault: '0xc6c85287a8b173A509C2F198bB719A8a5a2d0C68',
    },
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x11b93C162aABFfD026539bb3B9F9eC22c8b7ef8a',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [BSC_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x13b70564b1ec12876b20fab5d1bb630311312f4f',
      decimal: 18,
      symbol: 'BNB',
      name: 'BNB',
      vault: '0x40Cd41b35DB9e5109ae7E54b44De8625dB320E6b',
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB.address]: {
      asset: '0x57fC2aC5701e463ae261AdBd6C99FBeB48Ce5293',
      decimal: 18,
      symbol: 'ETHB',
      name: 'Wrapped Ethereum',
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB.address]: {
      asset: '0xD8A24c71FEa5bB81c66C01e532dE7d9B11e13905',
      decimal: 18,
      symbol: 'BTCB',
      name: 'Wrapped Bitcoin',
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x5Ce6C1c51ff762cF3acD21396257046f694168b6',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x9d58508ad10d34048a11640735ca5075bba07b35',
      decimal: 18,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [POLYGON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x9ee17486571917837210824b0d4cadfe3b324d12',
      decimal: 18,
      symbol: 'MATIC',
      name: 'Polygon',
      vault: '0x0000000000000000000000000000000000000000',
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x18f85f9E80ff9496EeBD5979a051AF16Ce751567',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xa36893ba308b332FDEbfa95916D1dF3a2e3CF8B3',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [INJECTIVE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ.address]: {
      asset: '0xd375590b4955f6ea5623f799153f9b787a3bd319',
      decimal: 18,
      symbol: 'INJ',
      name: 'Injective',
      vault: '0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13',
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x69425FFb14704124A58d6F69d510f74A59D9a5bC',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x4bc1211faa06fb50ff61a70331f56167ae511057',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [STELLAR_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x8ac68af223907fb1b893086601a3d99e00f2fa9d',
      decimal: 7,
      symbol: 'XLM',
      name: 'Stellar Lumens',
      vault: '0x6BC8C37cba91F76E68C9e6d689A9C21E4d32079B',
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x23225Ab8E63FCa4070296678cb46566d57E1BBe3',
      decimal: 7,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x348007B53F25A9A857aB8eA81ec9E3CCBCf440f2',
      decimal: 7,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [SUI_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x4676b2a551b25c04e235553c1c81019337384673',
      decimal: 9,
      symbol: 'SUI',
      name: 'Sui',
      vault: '0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3',
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDf23097B9AEb917Bf8fb70e99b6c528fffA35364',
      decimal: 9,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0x5635369c8a29A081d26C2e9e28012FCa548BA0Cb',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [SOLANA_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL.address]: {
      asset: '0x0c09e69a4528945de6d16c7e469dea6996fdf636',
      decimal: 9,
      symbol: 'SOL',
      name: 'Solana',
      vault: '0xdEa692287E2cE8Cb08FA52917Be0F16b1DACDC87',
    },
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x14C65b1CDc0B821569081b1F77342dA0D0CbF439',
      decimal: 9,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.USDC.address]: {
      asset: '0xC3f020057510ffE10Ceb882e1B48238b43d78a5e',
      decimal: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
  },
  [ICON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      symbol: 'ICX',
      name: 'ICON',
      vault: '0x0000000000000000000000000000000000000000',
    },
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].addresses.wICX]: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      symbol: 'wICX',
      name: 'ICON',
      vault: '0x0000000000000000000000000000000000000000',
    },
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x654dddf32a9a2ac53f5fb54bf1e93f66791f8047',
      decimal: 18,
      symbol: 'bnUSD',
      name: 'bnUSD',
      vault: '0x9D4b663Eb075d2a1C7B8eaEFB9eCCC0510388B51',
    },
  },
  [NEAR_MAINNET_CHAIN_ID]:{

  }
} as const;

export const DEFAULT_RELAYER_API_ENDPOINT = 'https://xcall-relay.nw.iconblockchain.xyz';

const solverConfig = {
  [SONIC_MAINNET_CHAIN_ID]: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz', // TODO replace with mainnet
  } satisfies SolverConfig,
};

export const getSolverConfig = (chainId: HubChainId): SolverConfig => solverConfig[chainId];

// currently supported spoke chain tokens for solver
const solverSupportedTokens: Record<SpokeChainId, readonly Token[]> = {
  [SONIC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wSonic,
  ] as const satisfies Token[],
  [AVALANCHE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.AVAX,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [ARBITRUM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT,
  ] as const satisfies Token[],
  [BASE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC,
  ] as const satisfies Token[],
  [OPTIMISM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT,
  ] as const satisfies Token[],
  [POLYGON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.POL,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [BSC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BNB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [SOLANA_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [ICON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.wICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const satisfies Token[],
  [STELLAR_MAINNET_CHAIN_ID]: [
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.XLM,
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [SUI_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [INJECTIVE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const satisfies Token[],
  [NIBIRU_MAINNET_CHAIN_ID]: [] as const satisfies Token[],
  [NEAR_MAINNET_CHAIN_ID]:[] as const satisfies Token[],
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

// currently supported spoke chain tokens for money market
const moneyMarketSupportedTokens = {
  [AVALANCHE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.AVAX,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const,
  [ARBITRUM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.WBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.tBTC,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const,
  [BASE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.cbBTC,
  ] as const,
  [OPTIMISM_MAINNET_CHAIN_ID]: [
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.ETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.wstETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH,
    spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.USDT,
  ] as const,
  [POLYGON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.POL,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const,
  [BSC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BNB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.ETHB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.BTCB,
    spokeChainConfig[BSC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const,
  [SOLANA_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.SOL,
    spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const,
  [ICON_MAINNET_CHAIN_ID]: [
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.wICX,
  ] as const,
  [STELLAR_MAINNET_CHAIN_ID]: [
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.XLM,
    spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  ] as const,
  [SUI_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.SUI,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const,
  [INJECTIVE_MAINNET_CHAIN_ID]: [
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.INJ,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].supportedTokens.USDC,
  ] as const,
  [NIBIRU_MAINNET_CHAIN_ID]: [] as const,
  [SONIC_MAINNET_CHAIN_ID]: [
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.Sonic,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.WETH,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDT,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.wSonic,
  ] as const,
  [NEAR_MAINNET_CHAIN_ID]:[] as const,
} as const satisfies Record<SpokeChainId, Readonly<Token[]>>;

export const isMoneyMarketSupportedToken = (chainId: SpokeChainId, token: string): boolean =>
  moneyMarketSupportedTokens[chainId].some(t => t.address.toLowerCase() === token.toLowerCase());

// get supported spoke chain tokens for money market
export const getSupportedMoneyMarketTokens = (chainId: SpokeChainId): readonly Token[] =>
  moneyMarketSupportedTokens[chainId];

export const HubVaultSymbols = [
  'sodaAVAX',
  'sodaBNB',
  'sodaETH',
  'sodaBTC',
  'sodaSUI',
  'sodaINJ',
  'sodaXLM',
  'sodaSOL',
] as const;

export type HubVaultSymbol = (typeof HubVaultSymbols)[number];

export const hubVaults: Record<HubVaultSymbol, VaultType> = {
  sodaAVAX: {
    // SODA AVAX vault
    address: '0x14238d267557e9d799016ad635b53cd15935d290',
    reserves: [
      // hub asset addresses contained in the vault
      '0xc9e4f0b6195f389d9d2b639f2878b7674eb9d8cd', // AvalancheAVAX hub asset
    ] as const,
  },
  sodaBNB: {
    // SODA BNB vault
    address: '0x40cd41b35db9e5109ae7e54b44de8625db320e6b',
    reserves: [
      // hub asset addresses contained in the vault
      '0x13b70564b1ec12876b20fab5d1bb630311312f4f', // BSC BNB hub asset
    ] as const,
  },
  sodaETH: {
    // SODA ETH vault
    address: '0x4effb5813271699683c25c734f4dabc45b363709',
    reserves: [
      // hub asset addresses contained in the vault
      '0x70178089842be7f8e4726b33f0d1569db8021faa', // BASE ETH hub asset
      '0xad332860dd3b6f0e63f4f66e9457900917ac78cd', // Optimism ETH hub asset
      '0xdcd9578b51ef55239b6e68629d822a8d97c95b86', // Arbitrum ETH hub asset
      '0x57fc2ac5701e463ae261adbd6c99fbeb48ce5293', // BSC ETH hub asset
    ] as const,
  },
  sodaBTC: {
    // SODA BTC vault
    address: '0x7a1a5555842ad2d0ed274d09b5c4406a95799d5d',
    reserves: [
      // hub asset addresses contained in the vault
      '0x2803a23a3ba6b09e57d1c71dec0d9efdbb00a27f', // BASE cbBTC hub asset,
      '0xfb0acb1b2720b620935f50a6dd3f7fea52b2fcbe', // Arbitrum wBTC hub asset
      '0x96fc8540736f1598b7e235e6de8814062b3b5d3b', // Arbitrum tBTC hub asset,
      '0xd8a24c71fea5bb81c66c01e532de7d9b11e13905', // BSC BTCB hub asset
    ] as const,
  },
  sodaSUI: {
    // SODA SUI vault
    address: '0xdc5b4b00f98347e95b9f94911213dab4c687e1e3',
    reserves: [
      // hub asset addresses contained in the vault
      '0x4676b2a551b25c04e235553c1c81019337384673', // SUI SUI hub asset
    ] as const,
  },
  sodaINJ: {
    // SODA INJ vault
    address: '0x1f22279c89b213944b7ea41dacb0a868ddcdfd13',
    reserves: [
      // hub asset addresses contained in the vault
      '0xd375590b4955f6ea5623f799153f9b787a3bd319', // Injective INJ hub asset
    ] as const,
  },
  sodaXLM: {
    // SODA XLM vault
    address: '0x6bc8c37cba91f76e68c9e6d689a9c21e4d32079b',
    reserves: [
      // hub asset addresses contained in the vault
      '0x8ac68af223907fb1b893086601a3d99e00f2fa9d', // Stellar XLM hub asset
    ] as const,
  },
  sodaSOL: {
    // SODA SOL vault
    address: '0xdea692287e2ce8cb08fa52917be0f16b1dacdc87',
    reserves: [
      // hub asset addresses contained in the vault
      '0x0c09e69a4528945de6d16c7e469dea6996fdf636', // Solana SOL hub asset
    ] as const,
  },
} as const;

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
  hubVaults['sodaAVAX'].address,
  hubVaults['sodaBNB'].address,
  hubVaults['sodaETH'].address,
  hubVaults['sodaBTC'].address,
  hubVaults['sodaSUI'].address,
  hubVaults['sodaINJ'].address,
  hubVaults['sodaXLM'].address,
  hubVaults['sodaSOL'].address,
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
export const spokeChainIdsSet = new Set(SPOKE_CHAIN_IDS);

export const getHubAssetInfo = (chainId: SpokeChainId, asset: OriginalAssetAddress): HubAssetInfo | undefined =>
  originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
export const isValidOriginalAssetAddress = (chainId: SpokeChainId, asset: OriginalAssetAddress): boolean =>
  originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
export const getOriginalAssetAddress = (chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined =>
  hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
export const isValidHubAsset = (hubAsset: Address): boolean =>
  supportedHubAssets.has(hubAsset.toLowerCase() as Address);
export const isValidChainHubAsset = (chainId: SpokeChainId, hubAsset: Address): boolean =>
  chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
export const isValidSpokeChainId = (chainId: SpokeChainId): boolean => spokeChainIdsSet.has(chainId);
export const isValidIntentRelayChainId = (chainId: bigint): boolean =>
  Object.values(INTENT_RELAY_CHAIN_IDS).some(id => id === chainId);
export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig) as HubChainId[];
export const supportedSpokeChains: SpokeChainId[] = Object.keys(spokeChainConfig) as SpokeChainId[];
export const intentRelayChainIdToSpokeChainIdMap: Map<IntentRelayChainId, SpokeChainId> = new Map(
  Object.entries(ChainIdToIntentRelayChainId).map(([chainId, intentRelayChainId]) => [
    intentRelayChainId,
    chainId as SpokeChainId,
  ]),
);
export const supportedTokensPerChain: Map<SpokeChainId, readonly Token[]> = new Map(
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



