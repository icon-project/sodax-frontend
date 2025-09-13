'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { getXChainType, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID, type ChainType, type SpokeChainId, type XToken } from '@sodax/types';
import { getChainDisplayName, scaleTokenAmount, normaliseTokenAmount, calculateMaxAvailableAmount } from '../_utils';

import { SuccessDialog } from './success-dialog';
import { ErrorDialog } from './error-dialog';
import { SwitchDirectionIcon } from '@/components/icons';
import CurrencyInputPanel, { CurrencyInputPanelType } from './currency-input-panel';
import { useMigrationInfo, useMigrationStore } from '../_stores/migration-store-provider';
import { icxToken, sodaToken } from '../_stores/migration-store';
import { formatUnits, parseUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from '../_hooks';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSpokeProvider, useSodaxContext } from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';

export default function IcxsodaMigration() {
  const openModal = useModalStore(state => state.openModal);

  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');
  const { sodax } = useSodaxContext();

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

  const { data: balances } = useXBalances({
    xChainId: ICON_MAINNET_CHAIN_ID,
    xTokens: [icxToken],
    address: iconAddress,
  });
  const icxBalance = balances?.[icxToken.address] || 0n;

  const { data: sodaBalances } = useXBalances({
    xChainId: SONIC_MAINNET_CHAIN_ID,
    xTokens: [sodaToken],
    address: sonicAddress,
  });
  const sodaBalance = BigInt(sodaBalances?.[sodaToken.address] || 0);

  // Get addresses for source and destination chains
  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  // Helper function to get balance for ICX/SODA chains
  const getBalanceForChain = (chainId: SpokeChainId, token: XToken): bigint => {
    return chainId === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance;
  };

  const handleMaxClick = async () => {
    const balance = getBalanceForChain(direction.from, currencies.from);

    try {
      // Estimate gas fee based on the chain
      let gasFeeEstimate: bigint;
      const fullBalance = normaliseTokenAmount(balance, currencies.from.decimals);
      const fullBalanceBigInt = scaleTokenAmount(fullBalance, currencies.from.decimals);
      const feeAmount = sodax.solver.getFee(fullBalanceBigInt);
      if (direction.from === ICON_MAINNET_CHAIN_ID) {
        gasFeeEstimate = parseUnits(
          (0.02 * Number(fullBalance) < 0.02 ? 0.02 : 0.02 * Number(fullBalance)).toString(),
          currencies.from.decimals,
        );
      } else {
        gasFeeEstimate = feeAmount;
      }

      const maxAvailableAmount = calculateMaxAvailableAmount(balance, currencies.from.decimals, gasFeeEstimate);
      setTypedValue(Number(maxAvailableAmount).toFixed(2));
    } catch (error) {
      console.error('Error calculating max amount with gas fees:', error);
      // Fallback to original behavior if gas estimation fails
      setTypedValue(Number(formatUnits(balance, currencies.from.decimals)).toFixed(2));
    }
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
    if (
      direction.from !== ICON_MAINNET_CHAIN_ID &&
      direction.from !== 'sui' &&
      direction.from !== 'stellar' &&
      !hasSufficientAllowance
    ) {
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
                {direction.from !== ICON_MAINNET_CHAIN_ID &&
                  direction.from !== 'sui' &&
                  direction.from !== 'stellar' && (
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
                  disabled={
                    isPending ||
                    !!error ||
                    (direction.from !== ICON_MAINNET_CHAIN_ID &&
                      direction.from !== 'sui' &&
                      direction.from !== 'stellar' &&
                      (!hasSufficientAllowance || isApproving))
                  }
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
          Takes ~1 min · Network fee: {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : '~0.1 Sonic'}
        </div>

        <div className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <Image src="/symbol_dark.png" alt="" width={16} height={16} />
            </div>
            <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
              {direction.from === ICON_MAINNET_CHAIN_ID ? "You're migrating to Sonic" : "You're migrating back to ICON"}
            </div>
          </div>
          <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
            {direction.from === ICON_MAINNET_CHAIN_ID
              ? "You won't need S token to receive your SODA. But you will for any future transactions on Sonic."
              : 'ICX will be sent to your connected ICON wallet.'}
          </div>
        </div>
      </div>

      <SuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
      <ErrorDialog open={showErrorDialog} onOpenChange={setShowErrorDialog} errorMessage={migrationError} />
    </div>
  );
}
