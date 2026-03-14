// Type guard functions for money market components - following best practices to avoid "as" type assertions

import { isAddress, type Address } from 'viem';
import type { UserReserveData } from '@sodax/sdk';
import type { XToken } from '@sodax/types';

/**
 * Type guard to check if a value is a valid UserReserveData object.
 * Validates the structure matches the UserReserveData type.
 */
export function isUserReserveData(value: unknown): value is UserReserveData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.underlyingAsset === 'string' &&
    typeof obj.scaledATokenBalance === 'bigint' &&
    typeof obj.usageAsCollateralEnabledOnUser === 'boolean' &&
    typeof obj.scaledVariableDebt === 'bigint'
  );
}

/**
 * Type guard to check if a value is an array of UserReserveData.
 * Validates each element in the array.
 */
export function isUserReserveDataArray(value: unknown): value is UserReserveData[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(item => isUserReserveData(item));
}

/**
 * Type guard to check if a string is a valid EVM address (0x format).
 * Uses viem's isAddress function for validation.
 */
export function isValidEvmAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && isAddress(value);
}

/**
 * Type guard to check if a value is an Address type.
 * Uses viem's isAddress function for validation.
 */
export function isValidAddress(value: unknown): value is Address {
  return typeof value === 'string' && isAddress(value);
}

/**
 * Type guard to check if an error object has a message property.
 * Used for safe error message extraction without type assertions.
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const errorObj = error as Record<string, unknown>;
  return 'message' in errorObj && typeof errorObj.message === 'string';
}

/**
 * Type guard to check if a value is a valid XToken object.
 * Validates the structure matches the XToken type (Token/Erc20Token with xChainId).
 */
export function isXToken(value: unknown): value is XToken {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.address === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.decimals === 'number' &&
    typeof obj.xChainId === 'string' &&
    (typeof obj.name === 'string' || obj.name === undefined)
  );
}

/**
 * Type guard to check if a value is an array of XToken.
 * Validates each element in the array.
 */
export function isXTokenArray(value: unknown): value is XToken[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(item => isXToken(item));
}
