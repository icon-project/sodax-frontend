import type { XToken } from '@sodax/types';

export const MIGRATION_MODE_ICX_SODA = 'icxsoda';
export const MIGRATION_MODE_BNUSD = 'bnusd';

export type MigrationMode = typeof MIGRATION_MODE_ICX_SODA | typeof MIGRATION_MODE_BNUSD;

export interface MigrationIntentParams {
  token: XToken | undefined;
  amount: string | undefined;
  sourceAddress: string | undefined;
  migrationMode?: MigrationMode;
  toToken?: XToken;
  destinationAddress?: string;
}
