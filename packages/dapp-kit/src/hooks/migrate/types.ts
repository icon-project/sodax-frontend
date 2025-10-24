// packages/dapp-kit/src/hooks/migrate/types.ts
import type { SpokeChainId } from '@sodax/types';

export const MIGRATION_MODE_ICX_SODA = 'icxsoda';
export const MIGRATION_MODE_BNUSD = 'bnusd';

export type MigrationMode = typeof MIGRATION_MODE_ICX_SODA | typeof MIGRATION_MODE_BNUSD;

export interface MigrationDirection {
  from: SpokeChainId;
  to: SpokeChainId;
}

export interface MigrationCurrencies {
  from: {
    address: string;
    decimals: number;
  };
  to: {
    address: string;
    decimals: number;
  };
}

export type MigrationParams = {
  migrationMode: MigrationMode;
  typedValue: string;
  direction: MigrationDirection;
  currencies: MigrationCurrencies;
  destinationAddress: string;
};
