import {
  type EvmHubProviderConfig,
  type HubChainId,
  type MoneyMarketConfig,
  MoneyMarketService,
  SONIC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
  Sodax,
  type SodaxConfig,
  type SolverConfig,
  getHubChainConfig,
  getMoneyMarketConfig,
} from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { defineChain } from 'viem';
import { http, createConfig } from 'wagmi';
import { avalancheFuji, mainnet, sepolia } from 'wagmi/chains';

export const sonicBlazeTestnet = /*#__PURE__*/ defineChain({
  id: 57_054,
  name: 'Sonic Blaze Testnet',
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
      name: 'Sonic Blaze Testnet Explorer',
      url: 'https://testnet.soniclabs.com/',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, avalancheFuji, sonicBlazeTestnet],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [sonicBlazeTestnet.id]: http(),
  },
});

const solanaEndpoint = 'https://solana-mainnet.g.alchemy.com/v2/nCndZC8P7BdiVKkczCErdwpIgaBQpPFM';

export const allXTokens: XToken[] = [
  {
    xChainId: '0xa869.fuji',
    symbol: 'AVAX',
    name: 'AVAX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'nwt',
    name: 'testcw20 Vault token',
    decimals: 18,
    address: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'AVAX',
    name: 'AVAX Vault Token',
    decimals: 18,
    address: '0xd40AbC1b98746E902Ab4194F1b6e09E8139Ba67c',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'ICX',
    name: 'ICX Vault token',
    decimals: 18,
    address: '0x70CB7B199700Ae2B1FAb3d4e6FecDa156FBf8182',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'STX',
    name: 'STX Vault token ',
    decimals: 18,
    address: '0x1d95b4c2793486BB9B58B5245DbB2B656A5b9EDA',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'SOL',
    name: 'Solana Vault token',
    decimals: 18,
    address: '0x8Ba33C0255c338A6295D282d5D97068E88b0df16',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'SUI',
    name: 'SUI Vault token',
    decimals: 18,
    address: '0x742BD79c9997A51F1c4F38F1F33C7841B0F34a7a',
  },
];

const IS_TESTNET = true;

const HUB_CHAIN_ID: HubChainId = SONIC_TESTNET_CHAIN_ID;

export const moneyMarketConfig: MoneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig: SolverConfig = IS_TESTNET
  ? {
      intentsContract: '0x611d800F24b5844Ea874B330ef4Ad6f1d5812f29',
      solverApiEndpoint: 'https://TODO',
      relayerApiEndpoint: 'https://TODO',
    }
  : {
      intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
      solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
      relayerApiEndpoint: 'https://testnet-xcall-relay.nw.iconblockchain.xyz',
    };

export const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;

export const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);
