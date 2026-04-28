// packages/sdk/src/migration/migration-guards.test.ts
import { describe, expect, it } from 'vitest';
import { ChainKeys, spokeChainConfig } from '@sodax/types';
import { LockupPeriod } from './BalnSwapService.js';
import type { IcxMigrateParams, IcxCreateRevertMigrationParams } from './IcxMigrationService.js';
import type { UnifiedBnUSDMigrateParams } from './BnUSDMigrationService.js';
import type { BalnMigrateParams } from './BalnSwapService.js';
import {
  isBalnMigrateParams,
  isIcxCreateRevertMigrationParams,
  isIcxMigrateParams,
  isUnifiedBnUSDMigrateParams,
} from './migration-guards.js';

const icxMigrateFixture = {
  srcAddress: 'hx0136a591b8bf330f129fd75686199ee34f09ebbd',
  srcChainKey: ChainKeys.ICON_MAINNET,
  address: spokeChainConfig[ChainKeys.ICON_MAINNET].nativeToken,
  amount: 1n,
  dstAddress: '0x0000000000000000000000000000000000000002',
} satisfies IcxMigrateParams;

const balnFixture = {
  srcChainKey: ChainKeys.ICON_MAINNET,
  srcAddress: 'hx0136a591b8bf330f129fd75686199ee34f09ebbd',
  amount: 2n,
  lockupPeriod: LockupPeriod.NO_LOCKUP,
  dstAddress: '0x0000000000000000000000000000000000000003',
  stake: false,
} satisfies BalnMigrateParams;

const unifiedFixture = {
  srcAddress: 'hx0100000000000000000000000000000000000000',
  srcChainKey: ChainKeys.ICON_MAINNET,
  srcbnUSD: 'cx1000000000000000000000000000000000000000',
  dstChainKey: ChainKeys.SONIC_MAINNET,
  dstbnUSD: '0x0000000000000000000000000000000000000004',
  amount: 3n,
  dstAddress: '0x0000000000000000000000000000000000000005',
} satisfies UnifiedBnUSDMigrateParams<typeof ChainKeys.ICON_MAINNET>;

const icxRevertFixture = {
  srcAddress: '0x0000000000000000000000000000000000000006',
  srcChainKey: ChainKeys.SONIC_MAINNET,
  amount: 4n,
  dstAddress: 'hx0200000000000000000000000000000000000000',
} satisfies IcxCreateRevertMigrationParams;

describe('migration-guards', () => {
  it('isIcxMigrateParams accepts ICX migrate fixtures and rejects others', () => {
    expect(isIcxMigrateParams(icxMigrateFixture)).toBe(true);
    expect(isIcxMigrateParams(balnFixture)).toBe(false);
    expect(isIcxMigrateParams(unifiedFixture)).toBe(false);
    expect(isIcxMigrateParams(icxRevertFixture)).toBe(false);
    expect(isIcxMigrateParams({ ...icxMigrateFixture, lockupPeriod: LockupPeriod.NO_LOCKUP })).toBe(false);
  });

  it('isBalnMigrateParams accepts BALN fixtures and rejects ICX/unified', () => {
    expect(isBalnMigrateParams(balnFixture)).toBe(true);
    expect(isBalnMigrateParams(icxMigrateFixture)).toBe(false);
    expect(isBalnMigrateParams(unifiedFixture)).toBe(false);
  });

  it('isUnifiedBnUSDMigrateParams matches bnUSD shape only', () => {
    expect(isUnifiedBnUSDMigrateParams(unifiedFixture)).toBe(true);
    expect(isUnifiedBnUSDMigrateParams(icxMigrateFixture)).toBe(false);
  });

  it('isIcxCreateRevertMigrationParams accepts revert fixtures and rejects migrate/baln', () => {
    expect(isIcxCreateRevertMigrationParams(icxRevertFixture)).toBe(true);
    expect(isIcxCreateRevertMigrationParams(icxMigrateFixture)).toBe(false);
    expect(isIcxCreateRevertMigrationParams(balnFixture)).toBe(false);
  });
});
