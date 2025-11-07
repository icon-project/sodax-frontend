'use client';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import { getXChainType, useXAccount, useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import {
  ICON_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  type ChainType,
} from '@sodax/types';
import { useSpokeProvider, useRequestTrustline } from '@sodax/dapp-kit';

import { useMigrationInfo, useMigrationStore } from '../_stores/migration-store-provider';
import { parseUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from '@sodax/dapp-kit';
import { Check, Loader2 } from 'lucide-react';
import { MODAL_ID } from '@/stores/modal-store';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeProvider } from '@sodax/sdk';
import { useModalStore } from '@/stores/modal-store-provider';
import { SuccessDialog } from './success-dialog';
import { ErrorDialog } from './error-dialog';
import { useActivateStellarAccount } from '@/hooks/useActivateStellarAccount';
import { useValidateStellarTrustline } from '@/hooks/useValidateStellarTrustline';
import { useValidateStellarAccount } from '@/hooks/useValidateStellarAccount';

export const MigrateButton = () => {
  const openModal = useModalStore(state => state.openModal);

  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [migrationError, setMigrationError] = useState('');

  // Get addresses for source and destination chains
  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  // Get wallet provider for the source chain
  const walletProvider = useWalletProvider(direction.from);
  const spokeProvider = useSpokeProvider(direction.from, walletProvider);
  const migrateIntentParams = useMemo(() => {
    return {
      token: currencies.from,
      amount: typedValue,
      sourceAddress,
      migrationMode,
      toToken: currencies.to,
      destinationAddress,
    };
  }, [currencies.from, currencies.to, typedValue, sourceAddress, migrationMode, destinationAddress]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMigrationAllowance(migrateIntentParams, spokeProvider);
  const { approve, isLoading: isApproving, isApproved } = useMigrationApprove(migrateIntentParams, spokeProvider);

  const { inputError } = useMigrationInfo();

  const needsApproval = useMemo(() => {
    return ![ICON_MAINNET_CHAIN_ID, SUI_MAINNET_CHAIN_ID, STELLAR_MAINNET_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID].includes(
      direction.from,
    );
  }, [direction.from]);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currencies.from.xChainId);

  const { mutateAsync: migrate, isPending } = useMigrate(spokeProvider);
  const handleApprove = async () => {
    await approve({ params: migrateIntentParams });
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

  const { data: stellarAccountValidation } = useValidateStellarAccount(
    direction.to === STELLAR_MAINNET_CHAIN_ID ? destinationAddress : undefined,
  );

  const handleActivateStellarAccount = async () => {
    if (!destinationAddress) {
      return;
    }
    await activateStellarAccount({ address: destinationAddress });
  };
  const {
    activateStellarAccount,
    isLoading: isActivatingStellarAccount,
    isActivated: isActivatedStellarAccount,
  } = useActivateStellarAccount();

  // trustline

  const { data: stellarTrustlineValidation } = useValidateStellarTrustline(destinationAddress, currencies.to);

  const destinationWalletProvider = useWalletProvider(direction.to);
  const destinationSpokeProvider = useSpokeProvider(direction.to, destinationWalletProvider);

  // const { data: hasSufficientTrustline, isPending: isCheckingTrustline } = useStellarTrustlineCheck(
  //   currencies.to.address,
  //   parseUnits(typedValue, currencies.to.decimals),
  //   destinationSpokeProvider,
  //   direction.to,
  // );
  const {
    requestTrustline,
    isLoading: isRequestingTrustline,
    isRequested: hasTrustline,
  } = useRequestTrustline(currencies.to.address);
  const handleRequestTrustline = async () => {
    await requestTrustline({
      token: currencies.to.address,
      amount: parseUnits(typedValue, currencies.to.decimals),
      spokeProvider: destinationSpokeProvider as SpokeProvider,
    });
  };

  const handleMigrate = async () => {
    try {
      await migrate(migrateIntentParams);
      setTypedValue('');
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
        <div className="flex gap-2 w-full">
          {!isPending && inputError ? (
            <Button variant="cherry" className="w-full sm:w-[232px] md:w-[232px]" disabled>
              {inputError}
            </Button>
          ) : direction.to === STELLAR_MAINNET_CHAIN_ID &&
            !isActivatedStellarAccount &&
            stellarAccountValidation?.ok === false ? (
            <Button
              variant="cherry"
              className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
              onClick={handleActivateStellarAccount}
              disabled={isActivatingStellarAccount}
            >
              {isActivatingStellarAccount ? 'Activating Stellar Account' : 'Activate Stellar Account'}
              {isActivatingStellarAccount && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>
          ) : direction.to === STELLAR_MAINNET_CHAIN_ID && stellarTrustlineValidation?.ok === false && !hasTrustline ? (
            <Button
              className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
              variant="cherry"
              onClick={handleRequestTrustline}
              disabled={isRequestingTrustline}
            >
              {isRequestingTrustline ? 'Adding Stellar Trustline' : 'Add Stellar Trustline'}
              {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>
          ) : isWrongChain ? (
            <Button
              variant="cherry"
              className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
              onClick={handleSwitchChain}
            >
              Switch to {chainIdToChainName(direction.from)}
            </Button>
          ) : (
            <>
              {needsApproval && (
                <Button
                  className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
                  variant="cherry"
                  onClick={handleApprove}
                  disabled={isApproving || isAllowanceLoading || hasSufficientAllowance || !!inputError}
                  hidden={hasSufficientAllowance}
                >
                  {isApproving ? 'Approving' : hasSufficientAllowance ? 'Approved' : 'Approve'}
                  {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {hasSufficientAllowance && <Check className="w-4 h-4 text-clay-light" />}
                </Button>
              )}
              {hasSufficientAllowance && (
                <Button
                  className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
                  variant="cherry"
                  onClick={handleMigrate}
                  disabled={isPending || !!inputError || (needsApproval && (!hasSufficientAllowance || isApproving))}
                >
                  {isPending ? 'Migrating' : 'Migrate'}
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <Button
          variant="cherry"
          className="w-full sm:w-[232px] md:w-[232px] text-(length:--body-comfortable) text-white"
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
