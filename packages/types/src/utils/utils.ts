import {
  newbnUSDSpokeChainIds,
  type SpokeChainKey,
  type LegacybnUSDChainId,
  type NewbnUSDChainId,
  type XToken,
  bnUSDLegacySpokeChainIds,
  bnUSDLegacyTokens,
  type ConcentratedLiquidityConfig,
  type SolverConfig,
  solverConfig,
  concentratedLiquidityConfig,
  spokeChainConfig,
  moneyMarketConfig,
  type LegacybnUSDToken,
  type MoneyMarketConfig,
  spokeChainKeysSet,
  HUB_CHAIN_KEY,
  type EVM_CHAIN_KEYS,
  EVM_CHAIN_KEYS_SET,
  BITCOIN_CHAIN_KEYS_SET,
  type BITCOIN_CHAIN_KEYS,
  SONIC_CHAIN_KEYS_SET,
  type SONIC_CHAIN_KEYS,
  SOLANA_CHAIN_KEYS_SET,
  type SOLANA_CHAIN_KEYS,
  NEAR_CHAIN_KEYS_SET,
  type NEAR_CHAIN_KEYS,
  STELLAR_CHAIN_KEYS_SET,
  type STELLAR_CHAIN_KEYS,
  ICON_CHAIN_KEYS_SET,
  type ICON_CHAIN_KEYS,
  SUI_CHAIN_KEYS_SET,
  type SUI_CHAIN_KEYS,
  INJECTIVE_CHAIN_KEYS_SET,
  type INJECTIVE_CHAIN_KEYS,
  STACKS_CHAIN_KEYS_SET,
  type STACKS_CHAIN_KEYS,
  baseChainInfo,
  type ChainType,
  ChainIdToIntentRelayChainId,
  type IntentRelayChainId,
  type ChainKey,
  IntentRelayChainIdToChainKey,
} from '../index.js';

export function isHubChainKey(chainId: SpokeChainKey): boolean {
  return chainId === HUB_CHAIN_KEY;
}

export function isSpokeChainKey(chainId: SpokeChainKey): boolean {
  return spokeChainKeysSet.has(chainId);
}

// NOTE: this function includes sonic (hub chain)
export function isEvmChainKey(chainId: SpokeChainKey): boolean {
  return EVM_CHAIN_KEYS_SET.has(chainId as (typeof EVM_CHAIN_KEYS)[number]);
}

export function isBitcoinChainKey(chainId: SpokeChainKey): boolean {
  return BITCOIN_CHAIN_KEYS_SET.has(chainId as (typeof BITCOIN_CHAIN_KEYS)[number]);
}

export function isSonicChainKey(chainId: SpokeChainKey): boolean {
  return SONIC_CHAIN_KEYS_SET.has(chainId as (typeof SONIC_CHAIN_KEYS)[number]);
}

export function isSolanaChainKey(chainId: SpokeChainKey): boolean {
  return SOLANA_CHAIN_KEYS_SET.has(chainId as (typeof SOLANA_CHAIN_KEYS)[number]);
}

export function isNearChainKey(chainId: SpokeChainKey): boolean {
  return NEAR_CHAIN_KEYS_SET.has(chainId as (typeof NEAR_CHAIN_KEYS)[number]);
}

export function isStellarChainKey(chainId: SpokeChainKey): boolean {
  return STELLAR_CHAIN_KEYS_SET.has(chainId as (typeof STELLAR_CHAIN_KEYS)[number]);
}

export function isIconChainKey(chainId: SpokeChainKey): boolean {
  return ICON_CHAIN_KEYS_SET.has(chainId as (typeof ICON_CHAIN_KEYS)[number]);
}

export function isSuiChainKey(chainId: SpokeChainKey): boolean {
  return SUI_CHAIN_KEYS_SET.has(chainId as (typeof SUI_CHAIN_KEYS)[number]);
}

export function isInjectiveChainKey(chainId: SpokeChainKey): boolean {
  return INJECTIVE_CHAIN_KEYS_SET.has(chainId as (typeof INJECTIVE_CHAIN_KEYS)[number]);
}

export function isStacksChainKey(chainId: SpokeChainKey): boolean {
  return STACKS_CHAIN_KEYS_SET.has(chainId as (typeof STACKS_CHAIN_KEYS)[number]);
}

export function getChainType(chainId: SpokeChainKey): ChainType {
  const type = baseChainInfo[chainId].type;
  if (!type) {
    throw new Error(
      `[getChainType] Unsupported chain id: ${chainId}. Valid chain ids: ${Object.keys(baseChainInfo).join(', ')}`,
    );
  }
  return type;
}

/**
 * Returns true if the provided chainId is a legacy bnUSD chain ID.
 */
export function isLegacybnUSDChainId(chainId: SpokeChainKey): boolean {
  return bnUSDLegacySpokeChainIds.includes(chainId as LegacybnUSDChainId);
}

/**
 * Returns true if the provided chainId is a new bnUSD chain ID.
 */
export function isNewbnUSDChainId(chainId: SpokeChainKey): boolean {
  return newbnUSDSpokeChainIds.includes(chainId as NewbnUSDChainId);
}

/**
 * Returns true if the provided token (by object or address string) is a legacy bnUSD token.
 */
export function isLegacybnUSDToken(token: XToken | string): boolean {
  if (typeof token === 'string') {
    return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.toLowerCase());
  }
  return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase());
}

/**
 * Returns true if the provided token (by object or address string) is a new bnUSD token.
 */
export function isNewbnUSDToken(token: XToken | string): boolean {
  if (typeof token === 'string') {
    return newbnUSDSpokeChainIds
      .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
      .some(t => t.address.toLowerCase() === token.toLowerCase());
  }
  return newbnUSDSpokeChainIds
    .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
    .some(t => t.address.toLowerCase() === token.address.toLowerCase());
}

/**
 * Returns all legacy bnUSD tokens, together with their chainId.
 */
export function getAllLegacybnUSDTokens(): { token: LegacybnUSDToken; chainId: LegacybnUSDChainId }[] {
  return bnUSDLegacySpokeChainIds.map(chainId => ({
    token: spokeChainConfig[chainId].supportedTokens.legacybnUSD,
    chainId,
  }));
}

/**
 * Returns the concentrated liquidity configuration object.
 */
export function getConcentratedLiquidityConfig(): ConcentratedLiquidityConfig {
  return concentratedLiquidityConfig;
}

export function getSolverConfig(): SolverConfig {
  return solverConfig;
}

export function isNativeToken(chainId: SpokeChainKey, token: XToken | string): boolean {
  if (typeof token === 'string') {
    return token.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
  }

  return token.address.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
}

export function getMoneyMarketConfig(): MoneyMarketConfig {
  return moneyMarketConfig;
}

export function getIntentRelayChainId(chainKey: SpokeChainKey): IntentRelayChainId {
  return ChainIdToIntentRelayChainId[chainKey];
}

export function getChainKeyFromRelayChainId(chainId: IntentRelayChainId): ChainKey {
  const chainKey = IntentRelayChainIdToChainKey.get(chainId);
  if (!chainKey) {
    throw new Error(`Invalid intent relay chain id: ${chainId}`);
  }
  return chainKey;
}
