import type { SpokeChainKey } from '@sodax/types';
import type { IcxMigrateParams, IcxCreateRevertMigrationParams } from './IcxMigrationService.js';
import type { UnifiedBnUSDMigrateParams } from './BnUSDMigrationService.js';
import type { BalnMigrateParams } from './BalnSwapService.js';

export function isIcxMigrateParams(value: unknown): value is IcxMigrateParams {
  return typeof value === 'object' && value !== null && 'address' in value && 'amount' in value && 'to' in value;
}

export function isUnifiedBnUSDMigrateParams(value: unknown): value is UnifiedBnUSDMigrateParams<SpokeChainKey> {
  return typeof value === 'object' && value !== null && 'srcbnUSD' in value && 'dstbnUSD' in value;
}

export function isBalnMigrateParams(value: unknown): value is BalnMigrateParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    'amount' in value &&
    'lockupPeriod' in value &&
    'to' in value &&
    'stake' in value
  );
}

export function isIcxCreateRevertMigrationParams(value: unknown): value is IcxCreateRevertMigrationParams {
  return typeof value === 'object' && value !== null && 'amount' in value && 'to' in value;
}
