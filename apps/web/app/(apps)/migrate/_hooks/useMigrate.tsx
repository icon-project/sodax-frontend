import { parseUnits } from 'viem';
import {
  isLegacybnUSDToken,
  isNewbnUSDToken,
  spokeChainConfig,
  type UnifiedBnUSDMigrateParams,
  type IconSpokeProvider,
  type SonicSpokeProvider,
} from '@sodax/sdk';
import {
  SONIC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  type SpokeChainId,
} from '@sodax/types';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk';
import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useMigrationStore } from '../_stores/migration-store-provider';
import { useMutation } from '@tanstack/react-query';
import { getChainName } from '@/constants/chains';

export interface MigrationResult {
  spokeTxHash: string;
  hubTxHash: string;
}

export function useMigrate() {
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');
  const { address: stellarAddress } = useXAccount('STELLAR');
  const { address: suiAddress } = useXAccount('SUI');
  const { address: solanaAddress } = useXAccount('SOLANA');
  const { address: injectiveAddress } = useXAccount('INJECTIVE');
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);

  const { sodax } = useSodaxContext();

  // Helper function to get the correct address for a chain
  const getAddressForChain = (chainId: SpokeChainId): string | undefined => {
    if (chainId === ICON_MAINNET_CHAIN_ID) return iconAddress;
    if (chainId === SONIC_MAINNET_CHAIN_ID) return sonicAddress;
    if (chainId === 'stellar') return stellarAddress;
    if (chainId === 'sui') return suiAddress;
    if (chainId === 'solana') return solanaAddress;
    if (chainId === INJECTIVE_MAINNET_CHAIN_ID) return injectiveAddress;

    // All EVM chains use the same address
    return sonicAddress;
  };

  // Helper function to get the chain type for a given chain ID
  const getXChainType = (chainId: SpokeChainId): string => {
    if (chainId === ICON_MAINNET_CHAIN_ID) return 'ICON';
    if (chainId === SONIC_MAINNET_CHAIN_ID) return 'EVM';
    if (chainId === 'stellar') return 'STELLAR';
    if (chainId === 'sui') return 'SUI';
    if (chainId === 'solana') return 'SOLANA';
    if (chainId === INJECTIVE_MAINNET_CHAIN_ID) return 'INJECTIVE';
    return 'EVM'; // Default to EVM for other chains
  };

  // Helper function to get chain display name
  const getChainDisplayName = (chainId: SpokeChainId): string => {
    // Try to get the name from the UI constants first
    const uiName = getChainName(chainId);
    if (uiName) return uiName;

    // Fallback to the spoke chain config
    try {
      return spokeChainConfig[chainId]?.chain?.name || chainId;
    } catch {
      // Final fallback to the chain ID itself
      return chainId;
    }
  };

  // Get wallet providers dynamically based on selected chains
  const sourceChainType = getXChainType(direction.from);
  const destinationChainType = getXChainType(direction.to);

  const sourceWalletProvider = useWalletProvider(direction.from);
  const destinationWalletProvider = useWalletProvider(direction.to);

  // Get spoke providers with wallet providers
  const sourceSpokeProvider = useSpokeProvider(direction.from, sourceWalletProvider);
  const destinationSpokeProvider = useSpokeProvider(direction.to, destinationWalletProvider);

  return useMutation({
    mutationFn: async () => {
      const amountToMigrate = parseUnits(typedValue, currencies.from.decimals);

      // Get the correct addresses for source and destination chains
      const sourceAddress = getAddressForChain(direction.from);
      const destinationAddress = getAddressForChain(direction.to);

      if (migrationMode === 'icxsoda') {
        // ICX/SODA migration logic
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

        // SODA to ICX migration
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

      // bnUSD migration logic - handle dynamic source/destination chains
      const isFromIcon = direction.from === ICON_MAINNET_CHAIN_ID;
      const isToIcon = direction.to === ICON_MAINNET_CHAIN_ID;

      if (isFromIcon) {
        // ICON to any other chain bnUSD migration
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
        };
        const result = await sodax.migration.migratebnUSD(params, sourceSpokeProvider, 30000);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
          return { spokeTxHash, hubTxHash };
        }
        throw new Error('bnUSD migration failed. Please try again.');
      }

      // Non-ICON to ICON or other chain bnUSD migration
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
      const isAllowed = await sodax.migration.isAllowanceValid(params, 'revert', sourceSpokeProvider);

      if (!isAllowed.ok) {
        console.error('Failed to check allowance:', isAllowed.error);
      } else if (!isAllowed.value) {
        // Approve if needed
        const approveResult = await sodax.migration.approve(params, 'revert', sourceSpokeProvider);

        if (approveResult.ok) {
          // Wait for approval transaction to be mined (only for EVM chains)
          if ('waitForTransactionReceipt' in sourceSpokeProvider.walletProvider) {
            await (
              sourceSpokeProvider.walletProvider as { waitForTransactionReceipt: (hash: string) => Promise<unknown> }
            ).waitForTransactionReceipt(approveResult.value);
          }
        } else {
          console.error('Failed to approve tokens:', approveResult.error);
          return;
        }
      }
      const result = await sodax.migration.migratebnUSD(params, sourceSpokeProvider, 30000);
      if (result.ok) {
        const [spokeTxHash, hubTxHash] = result.value;
        return { spokeTxHash, hubTxHash };
      }
      throw new Error('bnUSD reverse migration failed. Please try again.');
    },
  });
}
