import { parseUnits } from 'viem';
import {
  spokeChainConfig,
  type UnifiedBnUSDMigrateParams,
  type IconSpokeProvider,
  type SonicSpokeProvider,
  isLegacybnUSDToken,
} from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useMigrationStore } from '../_stores/migration-store-provider';
import { useMutation } from '@tanstack/react-query';
import { getChainDisplayName } from '../_utils/migration-utils';
import { MIGRATION_MODE_BNUSD, MIGRATION_MODE_ICX_SODA } from '../_stores/migration-store';

export interface MigrationResult {
  spokeTxHash: string;
  hubTxHash: string;
}

export function useMigrate() {
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);

  const { sodax } = useSodaxContext();

  const destinationAddress = useXAccount(direction.to).address;

  const sourceWalletProvider = useWalletProvider(direction.from);
  const sourceSpokeProvider = useSpokeProvider(direction.from, sourceWalletProvider);

  return useMutation({
    mutationFn: async () => {
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
          throw new Error(`${getChainDisplayName(direction.from)} provider unavailable. Reconnect your wallet.`);
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

        const errorMessage = isLegacybnUSDToken(currencies.from)
          ? 'bnUSD migration failed. Please try again.'
          : 'bnUSD reverse migration failed. Please try again.';
        throw new Error(errorMessage);
      }
    },
  });
}
