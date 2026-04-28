// packages/sdk/src/migration/migration-guards.ts
// Runtime narrowers for migration param unions used by MigrationService branching.
import type { SpokeChainKey } from '@sodax/types';
import type { IcxMigrateParams, IcxCreateRevertMigrationParams } from './IcxMigrationService.js';
import type { UnifiedBnUSDMigrateParams } from './BnUSDMigrationService.js';
import type { BalnMigrateParams } from './BalnSwapService.js';

function isMigrationRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isIcxMigrateParams(value: unknown): value is IcxMigrateParams {
  if (!isMigrationRecord(value)) return false;
  if (!('address' in value) || !('dstAddress' in value) || !('amount' in value)) return false;
  if (!('srcAddress' in value) || !('srcChainKey' in value)) return false;
  if ('srcbnUSD' in value || 'lockupPeriod' in value) return false;
  return true;
}

export function isUnifiedBnUSDMigrateParams(value: unknown): value is UnifiedBnUSDMigrateParams<SpokeChainKey> {
  if (!isMigrationRecord(value)) return false;
  if (!('srcbnUSD' in value) || !('dstbnUSD' in value) || !('dstChainKey' in value)) return false;
  if (!('srcAddress' in value) || !('srcChainKey' in value) || !('amount' in value) || !('dstAddress' in value)) {
    return false;
  }
  if ('address' in value || 'lockupPeriod' in value) return false;
  return true;
}

export function isBalnMigrateParams(value: unknown): value is BalnMigrateParams {
  if (!isMigrationRecord(value)) return false;
  if (
    !('amount' in value) ||
    !('lockupPeriod' in value) ||
    !('dstAddress' in value) ||
    !('stake' in value) ||
    !('srcAddress' in value) ||
    !('srcChainKey' in value)
  ) {
    return false;
  }
  if ('srcbnUSD' in value || 'address' in value) return false;
  return true;
}

export function isIcxCreateRevertMigrationParams(value: unknown): value is IcxCreateRevertMigrationParams {
  if (!isMigrationRecord(value)) return false;
  if (!('amount' in value) || !('dstAddress' in value)) return false;
  if (!('srcAddress' in value) || !('srcChainKey' in value)) return false;
  if ('srcbnUSD' in value || 'lockupPeriod' in value || 'address' in value) return false;
  return true;
}
