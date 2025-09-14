'use client';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import { getXChainType, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { ICON_MAINNET_CHAIN_ID, type ChainType, type SpokeChainId, type XToken } from '@sodax/types';
import { getChainDisplayName } from '../_utils';

import { SuccessDialog } from './success-dialog';
import { ErrorDialog } from './error-dialog';
import { SwitchDirectionIcon } from '@/components/icons';
import CurrencyInputPanel, { CurrencyInputPanelType } from './currency-input-panel';
import { useMigrationInfo, useMigrationStore } from '../_stores/migration-store-provider';
import { formatUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from '../_hooks';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSpokeProvider, useSodaxContext } from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';

export default function BnusdMigration() {
  const openModal = useModalStore(state => state.openModal);

  const { error } = useMigrationInfo();
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const switchDirection = useMigrationStore(state => state.switchDirection);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);
  const setChainForCurrency = useMigrationStore(state => state.setChainForCurrency);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [migrationError, setMigrationError] = useState('');

  // Get addresses for source and destination chains
  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  // Dynamic balance fetching for the currently selected chains
  const { data: fromChainBalances } = useXBalances({
    xChainId: direction.from,
    xTokens: [currencies.from],
    address: sourceAddress,
  });

  const { data: toChainBalances } = useXBalances({
    xChainId: direction.to,
    xTokens: [currencies.to],
    address: destinationAddress,
  });

  // Helper function to get balance for any chain
  const getBalanceForChain = (chainId: SpokeChainId, token: XToken): bigint => {
    // For bnUSD, use the dynamic balance fetching
    if (chainId === direction.from) {
      return fromChainBalances?.[token.address] || 0n;
    }
    if (chainId === direction.to) {
      return toChainBalances?.[token.address] || 0n;
    }

    // For other chains not currently selected, return 0
    return 0n;
  };

  const handleMaxClick = async () => {
    const balance = getBalanceForChain(direction.from, currencies.from);
    // For bnUSD migration, use original behavior (no gas fee estimation needed)
    setTypedValue(Number(formatUnits(balance, currencies.from.decimals)).toFixed(2));
  };

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
    return !['icon', 'sui', 'stellar', 'solana'].includes(direction.from);
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

  // Function to get button state based on current migration state
  const getButtonState = (): {
    text: string;
    disabled: boolean;
    action: 'connect' | 'enter-amount' | 'migrate' | 'insufficient-balance' | 'approve-required';
  } => {
    if (!isSourceChainConnected) {
      return {
        text: `Connect to ${getChainDisplayName(direction.from)}`,
        disabled: false,
        action: 'connect',
      };
    }

    if (!isDestinationChainConnected) {
      return {
        text: `Connect to ${getChainDisplayName(direction.to)}`,
        disabled: false,
        action: 'connect',
      };
    }

    if (!typedValue || typedValue === '0' || typedValue === '' || Number.isNaN(Number(typedValue))) {
      return {
        text: 'Enter amount',
        disabled: true,
        action: 'enter-amount',
      };
    }

    const sourceBalance = getBalanceForChain(direction.from, currencies.from);
    const inputAmount = BigInt(Math.floor(Number(typedValue) * 10 ** currencies.from.decimals));

    if (sourceBalance < inputAmount) {
      return {
        text: 'Insufficient balance',
        disabled: true,
        action: 'insufficient-balance',
      };
    }

    // Check if approval is required and not yet given
    if (needsApproval && !hasSufficientAllowance) {
      return {
        text: 'Approve required',
        disabled: false,
        action: 'approve-required',
      };
    }

    if (isPending) {
      return {
        text: 'Migrating...',
        disabled: true,
        action: 'migrate',
      };
    }

    if (error) {
      return {
        text: error,
        disabled: true,
        action: 'migrate',
      };
    }

    return {
      text: 'Migrate',
      disabled: false,
      action: 'migrate',
    };
  };

  // Handle wallet modal opening with proper chain targeting
  const handleOpenWalletModal = (): void => {
    const buttonState = getButtonState();

    if (buttonState.action === 'connect') {
      openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getTargetChainType() });
    }
  };

  return (
    <div className="flex flex-col w-full gap-(--layout-space-comfortable)">
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <div className="relative w-full">
          <CurrencyInputPanel
            type={CurrencyInputPanelType.INPUT}
            chainId={direction.from}
            currency={currencies.from}
            currencyBalance={getBalanceForChain(direction.from, currencies.from)}
            inputValue={typedValue}
            onInputChange={e => setTypedValue(e.target.value)}
            onMaxClick={handleMaxClick}
            onChainSelect={(chainId, token) => setChainForCurrency('from', chainId, token)}
            isChainConnected={isSourceChainConnected}
          />

          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            onClick={switchDirection}
          >
            <SwitchDirectionIcon className="w-3 h-3" />
          </Button>
        </div>

        <CurrencyInputPanel
          type={CurrencyInputPanelType.OUTPUT}
          chainId={direction.to}
          currency={currencies.to}
          currencyBalance={getBalanceForChain(direction.to, currencies.to)}
          inputValue={typedValue}
          onChainSelect={(chainId, token) => setChainForCurrency('to', chainId, token)}
          isChainConnected={isDestinationChainConnected}
        />
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-4">
        {isSourceChainConnected && isDestinationChainConnected ? (
          <div className="flex gap-2">
            {isWrongChain ? (
              <Button
                variant="cherry"
                className="w-[136px] md:w-[232px] text-(size:--body-comfortable) text-white"
                onClick={handleSwitchChain}
              >
                Switch to {getChainDisplayName(direction.from)}
              </Button>
            ) : (
              <>
                {needsApproval && (
                  <Button
                    className="w-34"
                    type="button"
                    variant="cherry"
                    onClick={handleApprove}
                    disabled={isApproving || isAllowanceLoading || hasSufficientAllowance || !!error}
                  >
                    {isApproving ? 'Approving' : hasSufficientAllowance ? 'Approved' : 'Approve'}
                    {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {hasSufficientAllowance && <Check className="w-4 h-4 text-clay-light" />}
                  </Button>
                )}

                <Button
                  variant="cherry"
                  className="w-[136px] md:w-[232px] text-(size:--body-comfortable) text-white"
                  onClick={async () => {
                    try {
                      await migrate();
                      setShowSuccessDialog(true);
                    } catch (error) {
                      console.error(error);
                      const errorMessage =
                        error instanceof Error ? error.message : 'Migration failed. Please try again.';
                      setMigrationError(errorMessage);
                      setShowErrorDialog(true);
                    }
                  }}
                  disabled={isPending || !!error || (needsApproval && (!hasSufficientAllowance || isApproving))}
                >
                  {error ? (
                    error
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
            disabled={getButtonState().disabled}
          >
            {getButtonState().text}
          </Button>
        )}

        <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Takes ~1 min · Network fee:{' '}
          {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : `~0.1 ${currencies.from.symbol}`}
        </div>

        <div className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <Image src="/symbol_dark.png" alt="" width={16} height={16} />
            </div>
            <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
              {`You're migrating bnUSD from ${getChainDisplayName(direction.from)} to ${getChainDisplayName(direction.to)}`}
            </div>
          </div>
          <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
            {direction.to === ICON_MAINNET_CHAIN_ID
              ? 'bnUSD will be sent to your connected ICON wallet.'
              : `bnUSD will be sent to your connected ${getChainDisplayName(direction.to)} wallet.`}
          </div>
        </div>
      </div>

      <SuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
      <ErrorDialog open={showErrorDialog} onOpenChange={setShowErrorDialog} errorMessage={migrationError} />
    </div>
  );
}
