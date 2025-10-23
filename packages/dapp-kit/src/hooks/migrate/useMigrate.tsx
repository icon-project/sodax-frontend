// packages/dapp-kit/src/hooks/migrate/useMigrate.tsx
import { parseUnits } from 'viem';
import {
  spokeChainConfig,
  type UnifiedBnUSDMigrateParams,
  type IconSpokeProvider,
  type SonicSpokeProvider,
  isLegacybnUSDToken,
} from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation } from '@tanstack/react-query';
import { MIGRATION_MODE_BNUSD, MIGRATION_MODE_ICX_SODA, type MigrationParams } from './types';

export interface MigrationResult {
  spokeTxHash: string;
  hubTxHash: string;
}

/**
 * Hook for executing migration operations between chains.
 *
 * This hook handles ICX/SODA and bnUSD migrations by accepting parameters
 * instead of relying on external stores.
 *
 * @param {MigrationParams} params - Migration parameters including mode, amount, direction, etc.
 * @returns {UseMutationResult} Mutation result object containing migration function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: migrate, isPending } = useMigrate({
 *   migrationMode: MIGRATION_MODE_ICX_SODA,
 *   typedValue: "100",
 *   direction: { from: "0x1", to: "0x2" },
 *   currencies: { from: { address: "0x...", decimals: 18 }, to: { address: "0x...", decimals: 18 } },
 *   destinationAddress: "0x...",
 *   sourceSpokeProvider: provider
 * });
 *
 * const result = await migrate();
 * ```
 */
export function useMigrate(params: MigrationParams) {
  const { sodax } = useSodaxContext();

  return useMutation({
    mutationFn: async () => {
      const { migrationMode, typedValue, direction, currencies, destinationAddress, sourceSpokeProvider } = params;
      const amountToMigrate = parseUnits(typedValue, currencies.from.decimals);

      if (migrationMode === MIGRATION_MODE_ICX_SODA) {
        // ICX->SODA migration logic
        if (direction.from === ICON_MAINNET_CHAIN_ID) {
          if (!sourceSpokeProvider) {
            throw new Error('ICON provider unavailable. Reconnect your ICON wallet.');
          }
          const params = {
            address: spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken,
            amount: amountToMigrate,
            to: destinationAddress as `0x${string}`,
          };
          const result = await sodax.migration.migrateIcxToSoda(
            params,
            sourceSpokeProvider as IconSpokeProvider,
            30000,
          );
          if (result.ok) {
            const [spokeTxHash, hubTxHash] = result.value;
            return { spokeTxHash, hubTxHash };
          }
          throw new Error('ICX to SODA migration failed. Please try again.');
        }

        // SODA->ICX migration
        if (!sourceSpokeProvider) {
          throw new Error('Sonic provider unavailable. Reconnect your Sonic wallet.');
        }
        const revertParams = {
          amount: amountToMigrate,
          to: destinationAddress as `hx${string}`,
        };
        const result = await sodax.migration.revertMigrateSodaToIcx(
          revertParams,
          sourceSpokeProvider as SonicSpokeProvider,
          30000,
        );
        if (result.ok) {
          const [hubTxHash, spokeTxHash] = result.value;
          return { spokeTxHash, hubTxHash };
        }
        throw new Error('SODA to ICX migration failed. Please try again.');
      }

      if (migrationMode === MIGRATION_MODE_BNUSD) {
        // bnUSD migration logic - handle dynamic source/destination chains
        if (!sourceSpokeProvider) {
          throw new Error(`${direction.from} provider unavailable. Reconnect your wallet.`);
        }

        const params = {
          srcChainId: direction.from,
          dstChainId: direction.to,
          srcbnUSD: currencies.from.address,
          dstbnUSD: currencies.to.address,
          amount: amountToMigrate,
          to: destinationAddress as `hx${string}` | `0x${string}`,
        } satisfies UnifiedBnUSDMigrateParams;

        const result = await sodax.migration.migratebnUSD(params, sourceSpokeProvider, 30000);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
          return { spokeTxHash, hubTxHash };
        }

        const errorMessage = isLegacybnUSDToken(currencies.from.address)
          ? 'bnUSD migration failed. Please try again.'
          : 'bnUSD reverse migration failed. Please try again.';
        throw new Error(errorMessage);
      }

      throw new Error('Invalid migration mode');
    },
  });
}
