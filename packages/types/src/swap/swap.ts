// currently supported spoke chain tokens for solver
import { type SpokeChainKey, type XToken, SodaTokens } from '../index.js';
import { spokeChainConfig, ChainKeys } from '../chains/chains.js';

export const swapSupportedTokens = {
  [ChainKeys.SONIC_MAINNET]: [
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.S,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.WETH,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.wS,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.SONIC_MAINNET].supportedTokens.bnUSD,
    ...Object.values(SodaTokens),
  ] as const satisfies XToken[],
  [ChainKeys.AVALANCHE_MAINNET]: [
    spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].supportedTokens.AVAX,
    spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.ARBITRUM_MAINNET]: [
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.ETH,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.WBTC,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.weETH,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.wstETH,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.tBTC,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.BASE_MAINNET]: [
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.ETH,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.weETH,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.wstETH,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.cbBTC,
    spokeChainConfig[ChainKeys.BASE_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.OPTIMISM_MAINNET]: [
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.ETH,
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.wstETH,
    // spokeChainConfig[OPTIMISM_MAINNET_CHAIN_ID].supportedTokens.weETH, // NOTE: Not Implemented
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.POLYGON_MAINNET]: [
    spokeChainConfig[ChainKeys.POLYGON_MAINNET].supportedTokens.POL,
    spokeChainConfig[ChainKeys.POLYGON_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.POLYGON_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.POLYGON_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.BSC_MAINNET]: [
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.BNB,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.ETHB,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.BTCB,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.BSC_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.HYPEREVM_MAINNET]: [
    spokeChainConfig[ChainKeys.HYPEREVM_MAINNET].supportedTokens.HYPE,
    spokeChainConfig[ChainKeys.HYPEREVM_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.HYPEREVM_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.HYPEREVM_MAINNET].supportedTokens.USDC,
  ] as const satisfies XToken[],
  [ChainKeys.LIGHTLINK_MAINNET]: [
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens.ETH,
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['BTC.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['AVAX.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['BNB.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['SOL.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['XLM.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['INJ.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['SUI.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['S.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['POL.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens['HYPE.LL'],
    spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].supportedTokens.LL,
  ] as const satisfies XToken[],
  [ChainKeys.SOLANA_MAINNET]: [
    spokeChainConfig[ChainKeys.SOLANA_MAINNET].supportedTokens.SOL,
    spokeChainConfig[ChainKeys.SOLANA_MAINNET].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[ChainKeys.SOLANA_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.SOLANA_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.ICON_MAINNET]: [
    spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.ICX,
    spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.wICX,
    spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.bnUSD,
    // spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.BALN, // NOTE: Not Implemented
    // spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.OMM, // NOTE: Not Implemented
  ] as const satisfies XToken[],
  [ChainKeys.STELLAR_MAINNET]: [
    spokeChainConfig[ChainKeys.STELLAR_MAINNET].supportedTokens.XLM,
    spokeChainConfig[ChainKeys.STELLAR_MAINNET].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[ChainKeys.STELLAR_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.STELLAR_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.SUI_MAINNET]: [
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.SUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.bnUSD, // NOTE: Not Implemented
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.afSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.mSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.haSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.vSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.yapSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.trevinSUI,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.DEEP,
    spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.WAL,
  ] as const satisfies XToken[],
  [ChainKeys.INJECTIVE_MAINNET]: [
    // spokeChainConfig[ChainKeys.INJECTIVE_MAINNET].supportedTokens.INJ,
    // spokeChainConfig[ChainKeys.INJECTIVE_MAINNET].supportedTokens.bnUSD, // NOTE: Not Implemented
    // spokeChainConfig[ChainKeys.INJECTIVE_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.INJECTIVE_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.NEAR_MAINNET]: [
    spokeChainConfig[ChainKeys.NEAR_MAINNET].supportedTokens.NEAR,
    spokeChainConfig[ChainKeys.NEAR_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.NEAR_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.NEAR_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.NEAR_MAINNET].supportedTokens.USDT,
  ] as const satisfies XToken[],
  [ChainKeys.BITCOIN_MAINNET]: [
    spokeChainConfig[ChainKeys.BITCOIN_MAINNET].supportedTokens.BTC,
    // spokeChainConfig[ChainKeys.BITCOIN_MAINNET].supportedTokens.BUSD, // TODO: re-enable when trading wallet balance is ready
  ] as const satisfies XToken[],
  [ChainKeys.ETHEREUM_MAINNET]: [
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.ETH,
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].supportedTokens.LL,
  ] as const,
  [ChainKeys.REDBELLY_MAINNET]: [
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.RBNT,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.USDC,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rETH,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rBTC,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rSOL,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rBNB,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rHYPE,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rAVAX,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rXLM,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rSUI,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rS,
    spokeChainConfig[ChainKeys.REDBELLY_MAINNET].supportedTokens.rPOL,
  ] as const satisfies XToken[],
  [ChainKeys.KAIA_MAINNET]: [
    spokeChainConfig[ChainKeys.KAIA_MAINNET].supportedTokens.KAIA,
    spokeChainConfig[ChainKeys.KAIA_MAINNET].supportedTokens.USDT,
    spokeChainConfig[ChainKeys.KAIA_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.KAIA_MAINNET].supportedTokens.SODA,
  ] as const satisfies XToken[],
  [ChainKeys.STACKS_MAINNET]: [
    spokeChainConfig[ChainKeys.STACKS_MAINNET].supportedTokens.STX,
    spokeChainConfig[ChainKeys.STACKS_MAINNET].supportedTokens.bnUSD,
    spokeChainConfig[ChainKeys.STACKS_MAINNET].supportedTokens.SODA,
    spokeChainConfig[ChainKeys.STACKS_MAINNET].supportedTokens.sBTC,
    spokeChainConfig[ChainKeys.STACKS_MAINNET].supportedTokens.USDC,
  ] as const satisfies XToken[],
} as const satisfies Record<SpokeChainKey, readonly XToken[]>;

// get supported spoke chain tokens for solver
export const getSupportedSolverTokens = (chainId: SpokeChainKey): readonly XToken[] => swapSupportedTokens[chainId];

// check if token address for given spoke chain id is supported
export const isSwapSupportedToken = (chainId: SpokeChainKey, token: string): boolean =>
  swapSupportedTokens[chainId].some(t => t.address.toLowerCase() === token.toLowerCase());
