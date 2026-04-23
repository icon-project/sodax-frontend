import type { EvmHubProvider } from '../entities/EvmHubProvider.js';
export type { RelayExtraData } from './relay-types.js';
import type { RelayExtraData } from './relay-types.js';

/**
 * Types derived from Core SDK specific types
 * NOTE: common (non Core SDK specific) types should be put in @sodax/types package
 */

export type HubProvider = EvmHubProvider;

export type RateLimitConfig = {
  maxAvailable: number;
  ratePerSecond: number;
  available: number;
};

/**
 * Structural types
 */
export type OptionalRaw<R extends boolean> = { raw?: R };
export type OptionalSkipSimulation = { skipSimulation?: boolean };
export type OptionalTimeout = { timeout?: number };
export type RelayOptionalExtraData = { data?: RelayExtraData };

export type { RawDestinationParams } from './spoke-types.js';
import type { RawDestinationParams } from './spoke-types.js';
export type DestinationParamsType = RawDestinationParams;
