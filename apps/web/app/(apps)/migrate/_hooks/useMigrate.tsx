import { parseUnits } from 'viem';
import { spokeChainConfig, type IconSpokeProvider, type SonicSpokeProvider } from '@sodax/sdk';
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
  const { typedValue, direction, currencies } = useMigrationStore(state => state);

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

      // else
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
    },
  });
}
