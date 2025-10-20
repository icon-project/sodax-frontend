'use client';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import { getXChainType, useXAccount } from '@sodax/wallet-sdk-react';
import {
  ICON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  type ChainType,
} from '@sodax/types';

import { useMigrationInfo, useMigrationStore } from '../_stores/migration-store-provider';
import { parseUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from '../_hooks';
import { Check, Loader2 } from 'lucide-react';
import { useSpokeProvider, useRequestTrustline, useStellarTrustlineCheck } from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { MODAL_ID } from '@/stores/modal-store';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeProvider } from '@sodax/sdk';
import { useModalStore } from '@/stores/modal-store-provider';
import { SuccessDialog } from './success-dialog';
import { ErrorDialog } from './error-dialog';

export const MigrateButton = () => {
  const openModal = useModalStore(state => state.openModal);

  const { inputError } = useMigrationInfo();
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [migrationError, setMigrationError] = useState('');

  // Get addresses for source and destination chains
  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  // Get wallet provider for the source chain
  const walletProvider = useWalletProvider(direction.from);
  const spokeProvider = useSpokeProvider(direction.from, walletProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMigrationAllowance(
    currencies.from,
    typedValue,
    sourceAddress,
    spokeProvider,
    migrationMode,
    currencies.to,
  );
  const {
    approve,
    isLoading: isApproving,
    isApproved,
  } = useMigrationApprove(
    currencies.from,
    typedValue,
    sourceAddress,
    spokeProvider,
    migrationMode,
    currencies.to,
    destinationAddress,
  );

  const needsApproval = useMemo(() => {
    return ![ICON_MAINNET_CHAIN_ID, SUI_MAINNET_CHAIN_ID, STELLAR_MAINNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID].includes(
      direction.from,
    );
  }, [direction.from]);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currencies.from.xChainId);

  const { mutateAsync: migrate, isPending } = useMigrate();
  const handleApprove = async () => {
    await approve();
  };

  // Combine allowance check with approval state for immediate UI feedback
  const hasSufficientAllowance = hasAllowed || isApproved;

  // Get chain types for source and destination
  const sourceChainType = getXChainType(direction.from);
  const destinationChainType = getXChainType(direction.to);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  // Function to determine which chain type to connect to
  const getTargetChainType = (): ChainType | undefined => {
    if (!isSourceChainConnected) {
      return sourceChainType;
    }
    if (!isDestinationChainConnected) {
      return destinationChainType;
    }
    return undefined;
  };

  const handleOpenWalletModal = (): void => {
    openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getTargetChainType() });
  };

  const destinationWalletProvider = useWalletProvider(direction.to);
  const destinationSpokeProvider = useSpokeProvider(direction.to, destinationWalletProvider);

  const { data: hasSufficientTrustline, isPending: isCheckingTrustline } = useStellarTrustlineCheck(
    currencies.to.address,
    parseUnits(typedValue, currencies.to.decimals),
    destinationSpokeProvider,
    direction.to,
  );
  const { mutateAsync: requestTrustline, isPending: isRequestingTrustline } = useRequestTrustline(
    currencies.to.address,
  );
  const handleRequestTrustline = async () => {
    await requestTrustline({
      token: currencies.to.address,
      amount: parseUnits(typedValue, currencies.to.decimals),
      spokeProvider: destinationSpokeProvider as SpokeProvider,
    });
  };

  const handleMigrate = async () => {
    try {
      await migrate();
      setShowSuccessDialog(true);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Migration failed. Please try again.';
      setMigrationError(errorMessage);
      setShowErrorDialog(true);
    }
  };

  return (
    <>
      {isSourceChainConnected && isDestinationChainConnected ? (
        <div className="flex gap-2">
          {isWrongChain ? (
            <Button
              variant="cherry"
              className="w-[136px] md:w-[232px] text-(size:--body-comfortable) text-white"
              onClick={handleSwitchChain}
            >
              Switch to {chainIdToChainName(direction.from)}
            </Button>
          ) : (
            <>
              {needsApproval && (
                <Button
                  className="w-34"
                  type="button"
                  variant="cherry"
                  onClick={handleApprove}
                  disabled={isApproving || isAllowanceLoading || hasSufficientAllowance || !!inputError}
                >
                  {isApproving ? 'Approving' : hasSufficientAllowance ? 'Approved' : 'Approve'}
                  {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {hasSufficientAllowance && <Check className="w-4 h-4 text-clay-light" />}
                </Button>
              )}
              {direction.to === STELLAR_MAINNET_CHAIN_ID && (
                <Button
                  className="w-34"
                  type="button"
                  variant="cherry"
                  onClick={handleRequestTrustline}
                  disabled={isCheckingTrustline || isRequestingTrustline || hasSufficientTrustline || !!inputError}
                >
                  {hasSufficientTrustline ? 'Trustline' : 'Add Trustline'}
                  {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin" />}
                  {hasSufficientTrustline && <Check className="w-4 h-4 text-clay-light" />}
                </Button>
              )}

              <Button
                variant="cherry"
                className="w-[136px] md:w-[232px] text-(size:--body-comfortable) text-white"
                onClick={handleMigrate}
                disabled={isPending || !!inputError || (needsApproval && (!hasSufficientAllowance || isApproving))}
              >
                {inputError ? (
                  inputError
                ) : (
                  <>
                    {isPending ? 'Migrating' : 'Migrate'}
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
          onClick={handleOpenWalletModal}
        >
          Connect {!isSourceChainConnected ? chainIdToChainName(direction.from) : chainIdToChainName(direction.to)}
        </Button>
      )}

      <SuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
      <ErrorDialog open={showErrorDialog} onOpenChange={setShowErrorDialog} errorMessage={migrationError} />
    </>
  );
};

export default MigrateButton;
