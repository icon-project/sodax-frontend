import { type Address, type Chain, defineChain } from 'viem';
import { arbitrum, avalanche, avalancheFuji, base, bsc, nibiru, optimism, polygon, sonic } from 'viem/chains';
import type {
  ChainId,
  ChainType,
  CosmosSpokeChainConfig,
  EvmChainId,
  EvmHubChainConfig,
  EvmSpokeChainConfig,
  GetSpokeChainConfigType,
  HubAssetInfo,
  HubChainConfig,
  HubChainId,
  IconSpokeChainConfig,
  IntentRelayChainId,
  MoneyMarketConfig,
  OriginalAssetAddress,
  SolanaChainConfig,
  SpokeChainConfig,
  SpokeChainId,
  StellarSpokeChainConfig,
  SuiSpokeChainConfig,
} from './index.js';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;
export const MAX_UINT256 = (1n << 256n) - 1n;

// NOTE: This is not the same as the actual chain ids (wormhole based ids), only used for intent relay
export const INTENT_RELAY_CHAIN_IDS = {
  AVAX: 6n,
  SUI: 21n,
  SONIC: 146n,
  STELLAR: 27n,
  INJ: 19n,
  SOL: 1n,
  ICON: 1768124270n,
  ARCHWAY: 1634886504n,
  BASE: 30n,
  BINANCE: 4n,
  OPTIMISM: 24n,
  POLYGON: 5n,
  ARBITRUM: 23n,
  NIBIRU: 7235938n,
} as const;

// chain ids (actual for evm chains), custom for other chains not having native ids
export const AVALANCHE_FUJI_TESTNET_CHAIN_ID = 43113;
export const AVALANCHE_MAINNET_CHAIN_ID = 43114;
export const ARBITRUM_MAINNET_CHAIN_ID = 42161;
export const BASE_MAINNET_CHAIN_ID = 8453;
export const BSC_MAINNET_CHAIN_ID = 56;
export const INJECTIVE_TESTNET_CHAIN_ID = 19;
export const INJECTIVE_MAINNET_CHAIN_ID = 18;
export const SONIC_TESTNET_CHAIN_ID = 57054;
export const SONIC_MAINNET_CHAIN_ID = 146;
export const ICON_TESTNET_CHAIN_ID = 1768124271;
export const ICON_MAINNET_CHAIN_ID = 1768124270;
export const SUI_TESTNET_CHAIN_ID = 21;
export const SUI_MAINNET_CHAIN_ID = 20;
export const ARCHWAY_TESTNET_CHAIN_ID = 1634886504;
export const OPTIMISM_MAINNET_CHAIN_ID = 10;
export const POLYGON_MAINNET_CHAIN_ID = 137;
export const SOLANA_MAINNET_CHAIN_ID = 1;
export const SOLANA_TESTNET_CHAIN_ID = 101;
export const STELLAR_TESTNET_CHAIN_ID = 2727;
export const STELLAR_MAINNET_CHAIN_ID = 27;
export const NIBIRU_MAINNET_CHAIN_ID = 7235938;

// hub chain ids (sonic mainnet and testnet)
export const HUB_CHAIN_IDS = [SONIC_MAINNET_CHAIN_ID, SONIC_TESTNET_CHAIN_ID] as const;

// currently supported spoke chains
export const SPOKE_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  INJECTIVE_TESTNET_CHAIN_ID,
  ICON_TESTNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  SUI_TESTNET_CHAIN_ID,
  ARCHWAY_TESTNET_CHAIN_ID,
  STELLAR_TESTNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SOLANA_TESTNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const MAINNET_CHAIN_IDS = [
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const TESTNET_CHAIN_IDS = [
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  INJECTIVE_TESTNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
  ICON_TESTNET_CHAIN_ID,
  SUI_TESTNET_CHAIN_ID,
  ARCHWAY_TESTNET_CHAIN_ID,
  STELLAR_TESTNET_CHAIN_ID,
  SOLANA_TESTNET_CHAIN_ID,
] as const;

export const CHAIN_IDS = [...MAINNET_CHAIN_IDS, ...TESTNET_CHAIN_IDS] as const;

export const EVM_CHAIN_IDS = [
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

export const EVM_SPOKE_CHAIN_IDS = [
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
] as const;

const ChainIdToIntentRelayChainId: Record<ChainId, IntentRelayChainId> = {
  [AVALANCHE_FUJI_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.AVAX,
  [AVALANCHE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.AVAX,
  [ARBITRUM_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ARBITRUM,
  [BASE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.BASE,
  [BSC_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.BINANCE,
  [INJECTIVE_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.INJ,
  [INJECTIVE_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.INJ,
  [SONIC_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SONIC,
  [SONIC_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SONIC,
  [OPTIMISM_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.OPTIMISM,
  [POLYGON_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.POLYGON,
  [SOLANA_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SOL,
  [SOLANA_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SOL,
  [SUI_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SUI,
  [SUI_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.SUI,
  [ARCHWAY_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ARCHWAY,
  [STELLAR_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.STELLAR,
  [STELLAR_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.STELLAR,
  [ICON_TESTNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ICON,
  [ICON_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.ICON,
  [NIBIRU_MAINNET_CHAIN_ID]: INTENT_RELAY_CHAIN_IDS.NIBIRU,
};

export const getIntentRelayChainId = (chainId: ChainId): IntentRelayChainId => ChainIdToIntentRelayChainId[chainId];

const sonicTestnet = /*#__PURE__*/ defineChain({
  id: 57054,
  name: 'Sonic Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['https://rpc.blaze.soniclabs.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Sonic Testnet Explorer',
      url: 'https://testnet.soniclabs.com/',
    },
  },
  testnet: true,
});

export function getEvmViemChain(id: EvmChainId): Chain {
  switch (id) {
    case SONIC_MAINNET_CHAIN_ID:
      return sonic;
    case SONIC_TESTNET_CHAIN_ID:
      return sonicTestnet;
    case AVALANCHE_MAINNET_CHAIN_ID:
      return avalanche;
    case AVALANCHE_FUJI_TESTNET_CHAIN_ID:
      return avalancheFuji;
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

const hubChainConfig: Record<HubChainId, HubChainConfig> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Sonic',
      id: SONIC_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x60c5681bD1DB4e50735c4cA3386005A4BA4937C0',
      hubWallet: '0xA0ed3047D358648F2C0583B415CffCA571FDB544',
      xTokenManager: '0x5bD2843de9D6b0e6A05d0FB742072274EA3C6CA3',
      bnUSDVault: '0x0000000000000000000000000000000000000000',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [],
  } satisfies EvmHubChainConfig,
  [SONIC_TESTNET_CHAIN_ID]: {
    chain: {
      name: 'Sonic Blaze Testnet',
      id: SONIC_TESTNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x594b477dd2195CCB5Ff43EafC9b8a8de0F4B4fA3',
      hubWallet: '0xd5CECE180a52e0353654B3337c985E8d5E056344',
      xTokenManager: '0x5b1Bd6d5C811FFA7688cf418FEF29877a3c0dBBa',
      bnUSDVault: '0x35cb50d8b896fcc1001dfc67c3772f2361e4d183',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'S',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
    ],
  } satisfies EvmHubChainConfig,
} as const;

export const getHubChainConfig = (chainId: HubChainId): HubChainConfig => hubChainConfig[chainId];

// TODO: make config hard typed on return (e.g. evm chain ids should return EvmSpokeChainConfig type)
export const spokeChainConfig: Record<SpokeChainId, SpokeChainConfig> = {
  [SOLANA_MAINNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'AnCCJjheynmGqPp6Vgat9DTirGKD4CtQzP8cwTYV8qKH',
      connection: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB',
      rateLimit: '2Vyy3A3Teju2EMCkdnappEeWqBXyAaF5V2WsrU4hDtsk',
      testToken: '3Q2HS3png7fLaYerqCun3zw8rnBZo2Ksvdg6RHTyM4Ns',
      xTokenManager: '',
    },
    chain: { id: SOLANA_MAINNET_CHAIN_ID, name: 'Solana', type: 'solana' },
    nativeToken: '11111111111111111111111111111111',
    bnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
    supportedTokens: [],
    gasPrice: '500000',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'https://api.mainnet-beta.solana.com',
    walletAddress: '',
  } satisfies SolanaChainConfig,
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Avalanche',
      id: AVALANCHE_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x5bDD1E1C5173F4c912cC919742FB94A55ECfaf86',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
    supportedTokens: [],
  } satisfies EvmSpokeChainConfig,
  [NIBIRU_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Nibiru',
      id: NIBIRU_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
      connection: '0x772FFE538E45b2cDdFB5823041EC26C44815B9AB',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0x043fb7e23350Dd5b77dE5E228B528763DEcb9131',
    supportedTokens: [],
  } satisfies EvmSpokeChainConfig,

  [ARBITRUM_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Arbitrum',
      id: ARBITRUM_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0xA256dd181C3f6E5eC68C6869f5D50a712d47212e',
    supportedTokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
      {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      },
      {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
      },
      {
        symbol: 'tBTC',
        name: 'Arbitrum tBTC v2',
        decimals: 18,
        address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (USDC)',
        decimals: 6,
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      },
    ],
  } satisfies EvmSpokeChainConfig,
  [BASE_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'BASE',
      id: BASE_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa',
    supportedTokens: [],
  } satisfies EvmSpokeChainConfig,
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Optimism',
      id: OPTIMISM_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
    supportedTokens: [],
  } satisfies EvmSpokeChainConfig,
  [BSC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'BSC',
      id: BSC_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0x8428FedC020737a5A2291F46cB1B80613eD71638',
    supportedTokens: [],
  } satisfies EvmSpokeChainConfig,
  [POLYGON_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Polygon',
      id: POLYGON_MAINNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
    supportedTokens: [
      {
        symbol: 'POL',
        name: 'Polygon',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      },
    ],
  } satisfies EvmSpokeChainConfig,
  [AVALANCHE_FUJI_TESTNET_CHAIN_ID]: {
    chain: {
      name: 'Avalanche Fuji Testnet',
      id: AVALANCHE_FUJI_TESTNET_CHAIN_ID,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x92971C06586576a14C0Deb583C8299B0B037bdC3',
      connection: '0x4031D470e73b5E72A0879Fc77aBf2F64049CF6BD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '',
    supportedTokens: [
      {
        symbol: 'S',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
    ],
  } satisfies EvmSpokeChainConfig,
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
      type: 'cosmos',
    },
    nativeToken: 'inj',
    bnUSD: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/bnUSD',
    networkId: 'injective-1',
    supportedTokens: [],
    gasPrice: '500000000inj',
    network: 'TestNet',
    prefix: 'inj',
    isBrowser: false,
    rpcUrl: 'https://injective-rpc.publicnode.com:443',
    walletAddress: '',
  } satisfies CosmosSpokeChainConfig,
  [STELLAR_MAINNET_CHAIN_ID]: {
    addresses: {
      connection: 'CDFQDDPUPAM3XPGORHDOEFRNLMKOH3N3X6XTXNLSXJQXIU3RVCM3OPEP',
      assetManager: 'CCGF33A4CO6D3BXFEKPXVCFCZBK76I3AQOZK6KIKRPAWAZR3632WHCJ3',
      xTokenManager: '',
      rateLimit: 'CB6G3ULISTTBPXUN3BI6ADHQGWJEN7BPQINHL45TCB6TDFM5QWU24HAY',
      testToken: '',
    },
    supportedTokens: [],
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    bnUSD: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
    rpc_url: 'https://rpc.ankr.com/stellar_soroban',
    chain: {
      name: 'soroban-mainnet',
      id: STELLAR_MAINNET_CHAIN_ID,
      type: 'stellar',
    },
  } satisfies StellarSpokeChainConfig,
  [INJECTIVE_TESTNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'inj1gru3eu7rmrsynu8ksfgd6tm05dy0ttuwej2nh2',
      connection: 'inj10cnfez7heja2s8kjjcm00quj0rkadknxm03hfa',
      rateLimit: 'inj1rhe9xj9mhwuxkxwqr3x6luq59s79egkjl3xjpp',
      testToken: 'inj172gzzhqxm60yvshmk3un0qcx2j97ezsdzy26ss',
      xTokenManager: '',
    },
    chain: {
      id: INJECTIVE_TESTNET_CHAIN_ID,
      name: 'Injective',
      type: 'cosmos',
    },
    nativeToken: 'inj',
    bnUSD: '',
    networkId: 'injective-888',
    supportedTokens: [],
    gasPrice: '0.025inj',
    network: 'TestNet',
    prefix: 'inj',
    isBrowser: false,
    rpcUrl: 'https://injective-testnet-rpc.publicnode.com:443',
    walletAddress: 'inj15slcxnxxtw6jn4chulgw78tdcd8ppgnm2un4ts',
  } satisfies CosmosSpokeChainConfig,
  [ARCHWAY_TESTNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'archway1ddsmzctpdszkyuq84cltmh30k86e6y26csray5nwl9l5ydsuad9se3hwhw',
      connection: 'archway1gfsfp5qrrreftfxl32rlyc2gdrm5je62h4kx83tjrxfd5vs63pkqprtclx',
      rateLimit: 'archway1ed6xrxx9g648g4gg4f2f6hf4n2ep4e82qf7gs9lguz2s70jeq3uq0g73h8',
      testToken: '',
      xTokenManager: '',
    },
    chain: {
      id: ARCHWAY_TESTNET_CHAIN_ID,
      name: 'Archway',
      type: 'cosmos',
    },
    nativeToken: 'aconst',
    bnUSD: '',
    supportedTokens: [],
    gasPrice: '500000000000aconst',
    network: 'TestNet',
    networkId: 'constantine-3',
    prefix: 'archway',
    rpcUrl: 'https://rpc.constantine.archway.io:443',
    isBrowser: false,
    walletAddress: 'archway1ywtvgurt69ujpd2cpx76ufd9c98rjm8jm6f9mw',
  } satisfies CosmosSpokeChainConfig,
  [SOLANA_TESTNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'AnCCJjheynmGqPp6Vgat9DTirGKD4CtQzP8cwTYV8qKH',
      connection: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB',
      rateLimit: '2Vyy3A3Teju2EMCkdnappEeWqBXyAaF5V2WsrU4hDtsk',
      testToken: '3Q2HS3png7fLaYerqCun3zw8rnBZo2Ksvdg6RHTyM4Ns',
      xTokenManager: '',
    },
    chain: { id: SOLANA_MAINNET_CHAIN_ID, name: 'Solana', type: 'solana' },
    nativeToken: '11111111111111111111111111111111',
    bnUSD: '',
    supportedTokens: [],
    gasPrice: '500000',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'https://api.devnet.solana.com',
    walletAddress: '14YCFqCF9rQ1BEmPegwZKjKwsGoP5d1AZmJmUXZTTEA5',
  } satisfies SolanaChainConfig,
  [STELLAR_TESTNET_CHAIN_ID]: {
    addresses: {
      connection: 'CB2QGJB675SQ43RBKZZCZQ44B33Y247NAIBYMO7U3WFFB2LHHX23E6ZK',
      assetManager: 'CBE2JXDRGUFEGEXU6KGP6Q5FJIROYG5ZXCJQCTH6Y3FWQIQ2TNIZVN5D',
      xTokenManager: '',
      rateLimit: 'CCFDSBX24HF77OCFVBKP36CO56PLEVAN225EMRZJGIDQNZAOVV4KIRWK',
      testToken: '',
    },
    supportedTokens: [],
    nativeToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    bnUSD: '',
    rpc_url: 'https://soroban-testnet.stellar.org',
    chain: {
      name: 'soroban-testnet',
      id: STELLAR_TESTNET_CHAIN_ID,
      type: 'stellar',
    },
  } satisfies StellarSpokeChainConfig,
  [SUI_MAINNET_CHAIN_ID]: {
    addresses: {
      connection:
        '0xf3b1e696a66d02cb776dc15aae73c68bc8f03adcb6ba0ec7f6332d9d90a6a3d2::connectionv3::0x3ee76d13909ac58ae13baab4c9be5a5142818d9a387aed641825e5d4356969bf',
      assetManager:
        '0xa17a409164d1676db71b411ab50813ba2c7dd547d2df538c699049566f1ff922::asset_manager::0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
      xTokenManager: '',
      rateLimit: '',
      testToken: '',
    },
    supportedTokens: [],
    nativeToken: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    bnUSD: '0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD',
    rpc_url: 'https://fullnode.mainnet.sui.io:443',
    chain: {
      name: 'sui',
      id: SUI_MAINNET_CHAIN_ID,
      type: 'sui',
    },
  } satisfies SuiSpokeChainConfig,
  [SUI_TESTNET_CHAIN_ID]: {
    addresses: {
      connection:
        '0xc0e61f9b2ba05922e1abe8656d6d5480b22eae084896bfbdf2ba54eb5eeb37e3::connectionv3::0xeb94ea14a2e1b012c9720cfb1b63f5d49c40aceb1b4eb0bc1006c93464162188',
      assetManager:
        '0x62f46afdc46ca87549e6655565dffb2913d4d8e97ad953f959d49bbcd4787f4d::asset_manager::0x42bef60a77ecee7973b790ab9477bce62d834208cac19b5ed21849d54097b685',
      xTokenManager: '',
      rateLimit: '',
      testToken:
        '0xc0ec9fc7688a435c385a2fd2f1cd6148f3218f70787fd84818ebdc48b045a9f2::nwt::0x3694296da388c970b54d4a50d1e03782bd6b4dc9ac002a73ce8b6a54cd0e684a',
    },
    supportedTokens: [],
    nativeToken: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    bnUSD: '',
    rpc_url: 'https://fullnode.testnet.sui.io:443',
    chain: {
      name: 'sui testnet',
      id: SUI_TESTNET_CHAIN_ID,
      type: 'sui',
    },
  } satisfies SuiSpokeChainConfig,
  [ICON_TESTNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'cx0aa4073cf4be3ee46b2b9d4e0bf374b17c2012a3',
      connection: 'cx4e2d496e97a82fd0e41a22d8d8e06bcabb99e346',
      rateLimit: 'cx628f2f825c07cce689cb6495ba8282a161dc1757',
    },
    chain: {
      id: ICON_TESTNET_CHAIN_ID,
      name: 'ICON Lisbon',
      type: 'icon',
    },
    supportedTokens: [],
    nativeToken: 'cxb93097e655a37ef5561eb05061edd406651cedb6',
    bnUSD: '',
    nid: '0x2',
  } satisfies IconSpokeChainConfig,
  [ICON_MAINNET_CHAIN_ID]: {
    addresses: {
      assetManager: 'cx1be33c283c7dc7617181d1b21a6a2309e71b1ee7',
      connection: 'cxe5cdf3b0f26967b0efc72d470d57bbf534268f94',
      rateLimit: 'cxbbdcea9e6757023a046067ba8daa3c4c50304358',
    },
    chain: {
      id: ICON_MAINNET_CHAIN_ID,
      name: 'ICON Mainnet',
      type: 'icon',
    },
    supportedTokens: [
      {
        symbol: 'wICX',
        name: 'Wrapped ICX',
        decimals: 18,
        address: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
      },
    ],
    nativeToken: 'cx0000000000000000000000000000000000000000',
    bnUSD: '',
    nid: '0x1',
  } satisfies IconSpokeChainConfig,
} as const;

export const hubAssets: Record<
  SpokeChainId,
  Record<Address | string, { asset: Address; decimal: number; vault: Address }>
> = {
  [AVALANCHE_FUJI_TESTNET_CHAIN_ID]: {
    [spokeChainConfig[AVALANCHE_FUJI_TESTNET_CHAIN_ID].nativeToken]: {
      asset: '0x18afE238E6366Bc3834844cC257acF1cfE52D8c5',
      decimal: 18,
      vault: '0xd40AbC1b98746E902Ab4194F1b6e09E8139Ba67c',
    },
    '0x162608464d2c70301d5ce214E57A70B08aAB4cf8': {
      asset: '0x4d28211e808fb07092519436cdfb8ea73085f131',
      decimal: 18,
      vault: '0x35CB50D8b896fCC1001dFc67C3772f2361E4d183',
    },
  },
  [AVALANCHE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xc9e4f0B6195F389D9d2b639f2878B7674eB9D8cD',
      decimal: 18,
      vault: '0x14238D267557E9d799016ad635B53CD15935d290',
    },
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7': {
      asset: '0x41Fd5c169e014e2A657B9de3553f7a7b735Fe47A',
      decimal: 6,
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },

    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': {
      asset: '0x41abF4B1559FF709Ef8150079BcB26DB1Fffd117',
      decimal: 6,
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[AVALANCHE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x289cDa1043b4Ce26BDCa3c12E534f56b24308A5B',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [ARBITRUM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xdcd9578b51ef55239b6e68629d822a8d97c95b86',
      decimal: 18,
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': {
      asset: '0xfB0ACB1b2720B620935F50a6dd3F7FEA52b2FCBe',
      decimal: 8,
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40': {
      asset: '0x96Fc8540736f1598b7E235e6dE8814062b3b5d3B',
      decimal: 18,
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': {
      asset: '0x3C0a80C6a1110fC80309382b3989eC626c135eE9',
      decimal: 6,
      vault: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
    },
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': {
      asset: '0xdB7BdA65c3a1C51D64dC4444e418684677334109',
      decimal: 6,
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x419cA9054E44E94ceAb52846eCdC3997439BBcA6',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [BASE_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x70178089842be7f8e4726b33f0d1569db8021faa',
      decimal: 18,
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': {
      asset: '0x2803a23a3BA6b09e57D1c71deC0D9eFdBB00A27F',
      decimal: 8,
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {
      asset: '0x72E852545B024ddCbc5b70C1bCBDAA025164259C',
      decimal: 6,
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[BASE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDF5639D91359866f266b56D60d98edE9fEEDd100',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [OPTIMISM_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xad332860dd3b6f0e63f4f66e9457900917ac78cd',
      decimal: 18,
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    [spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x238384AE2b4F0EC189ecB5031859bA306B2679c5',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [NIBIRU_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xe0064414c2c1a636a9424C7a17D86fbF7FD3f190',
      decimal: 18,
      vault: '0xc6c85287a8b173A509C2F198bB719A8a5a2d0C68',
    },
    [spokeChainConfig[NIBIRU_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x11b93C162aABFfD026539bb3B9F9eC22c8b7ef8a',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [BSC_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x13b70564b1ec12876B20FAb5D1Bb630311312f4f',
      decimal: 18,
      vault: '0x40Cd41b35DB9e5109ae7E54b44De8625dB320E6b',
    },
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8': {
      asset: '0x57fC2aC5701e463ae261AdBd6C99FBeB48Ce5293',
      decimal: 18,
      vault: '0x4effB5813271699683C25c734F4daBc45B363709',
    },
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c': {
      asset: '0xD8A24c71FEa5bB81c66C01e532dE7d9B11e13905',
      decimal: 18,
      vault: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
    },
    [spokeChainConfig[BSC_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x5Ce6C1c51ff762cF3acD21396257046f694168b6',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [POLYGON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x9ee17486571917837210824b0d4cadfe3b324d12',
      decimal: 18,
      vault: '0x0000000000000000000000000000000000000000',
    },
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': {
      asset: '0xa36893ba308b332FDEbfa95916D1dF3a2e3CF8B3',
      decimal: 6,
      vault: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
    },
    [spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x18f85f9E80ff9496EeBD5979a051AF16Ce751567',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },

  [INJECTIVE_TESTNET_CHAIN_ID]: {
    inj172gzzhqxm60yvshmk3un0qcx2j97ezsdzy26ss: {
      asset: '0xBC4BFEcd8067F1c7fbbF17fEcbFCbA56615C3b55',
      decimal: 12,
      vault: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
    },
    inj1fyt67lnhpkwyjekcs3awfdxv90kwmun73n9x7h: {
      asset: '0x3cBe8540208998De060E97B1AdE9fB0A31464c70',
      decimal: 18,
      vault: '0x35CB50D8b896fCC1001dFc67C3772f2361E4d183',
    },
  },
  [INJECTIVE_MAINNET_CHAIN_ID]: {
    inj: {
      asset: '0xd375590b4955f6ea5623f799153f9b787a3bd319',
      decimal: 18,
      vault: '0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13',
    },
    [spokeChainConfig[INJECTIVE_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x69425FFb14704124A58d6F69d510f74A59D9a5bC',
      decimal: 18,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [ARCHWAY_TESTNET_CHAIN_ID]: {
    aconst: {
      asset: '0xa4e0cbdf9a605ec54fc1d3e3089107fd55c3f064',
      decimal: 18,
      vault: '0xB0189e752973FEaae68BbcEcbdD4514c392D7ca3',
    },
  },
  [STELLAR_TESTNET_CHAIN_ID]: {
    [spokeChainConfig[STELLAR_TESTNET_CHAIN_ID].nativeToken]: {
      asset: '0xBc6C4b894D7942cC940C1C23CaA9F9F335aC2fcf',
      decimal: 7,
      vault: '0x1293c7efd9D48234E4Edd84C3dfcdfAF216B305b',
    },
  },
  [STELLAR_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x8ac68af223907fb1b893086601a3d99e00f2fa9d',
      decimal: 7,
      vault: '0x6BC8C37cba91F76E68C9e6d689A9C21E4d32079B',
    },
    [spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x23225Ab8E63FCa4070296678cb46566d57E1BBe3',
      decimal: 7,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [SUI_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0x4676b2a551b25c04e235553c1c81019337384673',
      decimal: 9,
      vault: '0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3',
    },
    [spokeChainConfig[SUI_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0xDf23097B9AEb917Bf8fb70e99b6c528fffA35364',
      decimal: 9,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
  },
  [SUI_TESTNET_CHAIN_ID]: {
    [spokeChainConfig[SUI_TESTNET_CHAIN_ID].nativeToken]: {
      asset: '0x088cfbf363465c5ee9282d004d98fac62f69329d',
      decimal: 9,
      vault: '0x742BD79c9997A51F1c4F38F1F33C7841B0F34a7a',
    },
    ['0xc0ec9fc7688a435c385a2fd2f1cd6148f3218f70787fd84818ebdc48b045a9f2::nwt::NWT']: {
      asset: '0xf9719328f664903d489336d41656caf777f3ec33',
      decimal: 9,
      vault: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
    },
    ['0x67bab56cff10de8854de706d7e71941221e687a04abb119a1f777d088ad98bf9::bnusd::BNUSD']: {
      asset: '0xb3183418c2c35c856cbfd1628218b0c74ef8cd47',
      decimal: 9,
      vault: '0x35CB50D8b896fCC1001dFc67C3772f2361E4d183',
    },
  },
  [ICON_TESTNET_CHAIN_ID]: {
    ['cxb93097e655a37ef5561eb05061edd406651cedb6']: {
      asset: '0x6acfc83bf253e8cfde6876cf1388a33dcf82b830',
      decimal: 18,
      vault: '0x70CB7B199700Ae2B1FAb3d4e6FecDa156FBf8182',
    },
  },
  [SOLANA_TESTNET_CHAIN_ID]: {
    '3Q2HS3png7fLaYerqCun3zw8rnBZo2Ksvdg6RHTyM4Ns': {
      asset: '0xa08416f478fbb342bb86b8b2f4433548f79b0e30',
      decimal: 9,
      vault: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
    },
    '11111111111111111111111111111111': {
      asset: '0x25903e762879dfabd30a70c32d3111b51dfefe49',
      decimal: 9,
      vault: '0x8Ba33C0255c338A6295D282d5D97068E88b0df16',
    },
  },
  [SOLANA_MAINNET_CHAIN_ID]: {
    //bnusd
    [spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].bnUSD]: {
      asset: '0x14C65b1CDc0B821569081b1F77342dA0D0CbF439',
      decimal: 9,
      vault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    },
    '11111111111111111111111111111111': {
      asset: '0x0c09e69a4528945de6d16c7e469dea6996fdf636',
      decimal: 9,
      vault: '0xdEa692287E2cE8Cb08FA52917Be0F16b1DACDC87',
    },
  },
  [ICON_MAINNET_CHAIN_ID]: {
    [spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken]: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      vault: '0x0000000000000000000000000000000000000000',
    },
    ['cx88fd7df7ddff82f7cc735c871dc519838cb235bb']: {
      asset: '0x654dddf32a9a2ac53f5fb54bf1e93f66791f8047',
      decimal: 18,
      vault: '0x9D4b663Eb075d2a1C7B8eaEFB9eCCC0510388B51',
    },
    ['cx3975b43d260fb8ec802cef6e60c2f4d07486f11d']: {
      asset: '0xb66cB7D841272AF6BaA8b8119007EdEE35d2C24F',
      decimal: 18,
      vault: '0x70CB7B199700Ae2B1FAb3d4e6FecDa156FBf8182',
    },
  },
} as const;

const moneyMarketConfig: Record<HubChainId, MoneyMarketConfig> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    lendingPool: '0x553434896D39F867761859D0FE7189d2Af70514E',
    uiPoolDataProvider: '0xC04d746C38f1E51C8b3A3E2730250bbAC2F271bf',
    poolAddressesProvider: '0x036aDe0aBAA4c82445Cb7597f2d6d6130C118c7b',
    bnUSD: '0x94dC79ce9C515ba4AE4D195da8E6AB86c69BFc38',
    bnUSDVault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  } satisfies MoneyMarketConfig,
  [SONIC_TESTNET_CHAIN_ID]: {
    lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
    uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
    poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
    bnUSD: '0x79C7C0f4B1e606da53dEb9871a7a97f31928C858',
    bnUSDVault: '0x35cb50d8b896fcc1001dfc67c3772f2361e4d183',
  } satisfies MoneyMarketConfig,
} as const;

export const getMoneyMarketConfig = (chainId: HubChainId): MoneyMarketConfig => moneyMarketConfig[chainId];

export const originalAssetTohubAssetMap: Map<SpokeChainId, Map<OriginalAssetAddress, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    Number(chainId) as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
  ]),
);
export const hubAssetToOriginalAssetMap: Map<SpokeChainId, Map<Address, OriginalAssetAddress>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    Number(chainId) as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
  ]),
);
export const chainIdToHubAssetsMap: Map<SpokeChainId, Map<Address, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    Number(chainId) as SpokeChainId,
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
export const isValidSpokeChainId = (chainId: number): boolean => spokeChainIdsSet.has(chainId as SpokeChainId);

export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig).map(Number) as HubChainId[];
export const supportedSpokeChains: SpokeChainId[] = Object.keys(spokeChainConfig).map(Number) as SpokeChainId[];
export const getSpokeChainConfigsPerType = <T extends ChainType>(type: T): GetSpokeChainConfigType<T>[] => {
  return Object.values(spokeChainConfig).filter(config => config.chain.type === type) as GetSpokeChainConfigType<T>[];
};
