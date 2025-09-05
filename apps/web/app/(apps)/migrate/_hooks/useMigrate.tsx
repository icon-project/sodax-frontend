import { parseUnits } from 'viem';
import {
  isLegacybnUSDToken,
  isNewbnUSDToken,
  spokeChainConfig,
  type UnifiedBnUSDMigrateParams,
  type IconSpokeProvider,
  type SonicSpokeProvider,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk';
import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useMigrationStore } from '../_stores/migration-store-provider';
import { useMutation } from '@tanstack/react-query';

export interface MigrationResult {
  spokeTxHash: string;
  hubTxHash: string;
}

export function useMigrate() {
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);

  const { sodax } = useSodaxContext();

  // Get wallet providers first
  const iconWalletProvider = useWalletProvider(ICON_MAINNET_CHAIN_ID);
  const sonicWalletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);

  // Then get spoke providers with wallet providers
  const iconSpokeProvider = useSpokeProvider(ICON_MAINNET_CHAIN_ID, iconWalletProvider) as IconSpokeProvider;
  const sonicSpokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, sonicWalletProvider) as SonicSpokeProvider;

  return useMutation({
    mutationFn: async () => {
      const amountToMigrate = parseUnits(typedValue, currencies.from.decimals);
      console.log('migrationMode', migrationMode);
      console.log('direction', direction);
      console.log('currencies', currencies);
      if (migrationMode === 'icxsoda') {
        // ICX/SODA migration logic
        if (direction.from === ICON_MAINNET_CHAIN_ID) {
          if (!iconSpokeProvider) {
            throw new Error('ICON provider unavailable. Reconnect your ICON wallet.');
          }
          const params = {
            address: spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken,
            amount: amountToMigrate,
            to: sonicAddress as `0x${string}`,
          };
          const result = await sodax.migration.migrateIcxToSoda(params, iconSpokeProvider, 30000);
          console.log('result', result);
          if (result.ok) {
            const [spokeTxHash, hubTxHash] = result.value;
            return { spokeTxHash, hubTxHash };
          }
          throw new Error('ICX to SODA migration failed. Please try again.');
        }

        // SODA to ICX migration
        if (!sonicSpokeProvider) {
          throw new Error('Sonic provider unavailable. Reconnect your Sonic wallet.');
        }
        const revertParams = {
          amount: amountToMigrate,
          to: iconAddress as `hx${string}`,
        };
        const result = await sodax.migration.revertMigrateSodaToIcx(revertParams, sonicSpokeProvider, 30000);
        if (result.ok) {
          const [hubTxHash, spokeTxHash] = result.value;
          return { spokeTxHash, hubTxHash };
        }
        throw new Error('SODA to ICX migration failed. Please try again.');
      }

      // bnUSD migration logic - handle dynamic source/destination chains
      const isFromIcon = direction.from === ICON_MAINNET_CHAIN_ID;
      const isToIcon = direction.to === ICON_MAINNET_CHAIN_ID;

      if (isFromIcon) {
        // ICON to any other chain bnUSD migration
        if (!iconSpokeProvider) {
          throw new Error('ICON provider unavailable. Reconnect your ICON wallet.');
        }
        const params = {
          srcChainId: direction.from,
          dstChainId: direction.to,
          srcbnUSD: currencies.from.address,
          dstbnUSD: currencies.to.address,
          amount: amountToMigrate,
          to: isToIcon ? (iconAddress as `hx${string}`) : (sonicAddress as `0x${string}`),
        };
        const result = await sodax.migration.migratebnUSD(params, iconSpokeProvider, 30000);
        console.log('bnUSD migration result', result);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
          return { spokeTxHash, hubTxHash };
        }
        throw new Error('bnUSD migration failed. Please try again.');
      }

      // Non-ICON to ICON or other chain bnUSD migration
      if (!sonicSpokeProvider) {
        throw new Error('Spoke provider unavailable. Reconnect your wallet.');
      }
      const params = {
        srcChainId: direction.from,
        dstChainId: direction.to,
        srcbnUSD: currencies.from.address,
        dstbnUSD: currencies.to.address,
        amount: amountToMigrate,
        to: isToIcon ? (iconAddress as `hx${string}`) : (sonicAddress as `0x${string}`),
      } satisfies UnifiedBnUSDMigrateParams;
      const isAllowed = await sodax.migration.isAllowanceValid(params, 'revert', sonicSpokeProvider);
      console.log('Is allowed', isAllowed);

      if (!isAllowed.ok) {
        console.error('Failed to check allowance:', isAllowed.error);
      } else if (!isAllowed.value) {
        // Approve if needed
        const approveResult = await sodax.migration.approve(params, 'revert', sonicSpokeProvider);

        if (approveResult.ok) {
          console.log('Approval transaction hash:', approveResult.value);
          // Wait for approval transaction to be mined
          await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
        } else {
          console.error('Failed to approve tokens:', approveResult.error);
          return;
        }
      }
      console.log(params);
      console.log(isLegacybnUSDToken(currencies.to), isNewbnUSDToken(currencies.from));
      const result = await sodax.migration.migratebnUSD(params, sonicSpokeProvider, 30000);
      console.log('bnUSD reverse migration result', result);
      if (result.ok) {
        const [spokeTxHash, hubTxHash] = result.value;
        return { spokeTxHash, hubTxHash };
      }
      throw new Error('bnUSD reverse migration failed. Please try again.');
    },
  });
}
