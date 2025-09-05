'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useWalletUI } from '../_context/wallet-ui';

import { useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID, INJECTIVE_MAINNET_CHAIN_ID, type SpokeChainId, type XToken } from '@sodax/types';
import { getChainName } from '@/constants/chains';
import { chainIdToChainName } from '@/providers/constants';

import { SuccessDialog, ErrorDialog } from './_components';
import { SwitchDirectionIcon } from '@/components/icons';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import { useMigrationInfo, useMigrationStore } from './_stores/migration-store-provider';
import { icxToken, sodaToken, iconBnusdToken, sonicBnusdToken } from './_stores/migration-store';
import { formatUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from './_hooks';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSpokeProvider } from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function MigratePage() {
  const { openWalletModal } = useWalletUI();
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');

  const { error } = useMigrationInfo();
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const switchDirection = useMigrationStore(state => state.switchDirection);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);
  const setMigrationMode = useMigrationStore(state => state.setMigrationMode);
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

  // Get addresses for all chain types
  const { address: stellarAddress } = useXAccount('STELLAR');
  const { address: suiAddress } = useXAccount('SUI');
  const { address: solanaAddress } = useXAccount('SOLANA');
  const { address: injectiveAddress } = useXAccount('INJECTIVE');

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

  // Dynamic balance fetching for the currently selected chains
  const { data: fromChainBalances } = useXBalances({
    xChainId: direction.from,
    xTokens: [currencies.from],
    address: getAddressForChain(direction.from),
  });

  const { data: toChainBalances } = useXBalances({
    xChainId: direction.to,
    xTokens: [currencies.to],
    address: getAddressForChain(direction.to),
  });

  // Helper function to get balance for any chain
  const getBalanceForChain = (chainId: SpokeChainId, token: XToken): bigint => {
    if (migrationMode === 'icxsoda') {
      return chainId === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance;
    }

    // For bnUSD, use the dynamic balance fetching
    if (chainId === direction.from) {
      console.log('fromChainBalances', fromChainBalances);
      return fromChainBalances?.[token.address] || 0n;
    }
    if (chainId === direction.to) {
      return toChainBalances?.[token.address] || 0n;
    }

    // For other chains not currently selected, return 0
    return 0n;
  };

  // Helper function to get chain display name
  const getChainDisplayName = (chainId: SpokeChainId): string => {
    // Try to get the name from the UI constants first
    const uiName = getChainName(chainId);
    if (uiName) return uiName;

    // Fallback to the provider's chain name
    try {
      return chainIdToChainName(chainId);
    } catch {
      // Final fallback to the chain ID itself
      return chainId;
    }
  };

  const handleMaxClick = () => {
    const value = getBalanceForChain(direction.from, currencies.from);
    setTypedValue(Number(formatUnits(value, currencies.from.decimals)).toFixed(2));
  };

  // Get wallet provider for the source chain
  const walletProvider = useWalletProvider(direction.from);
  const spokeProvider = useSpokeProvider(direction.from, walletProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMigrationAllowance(
    currencies.from,
    typedValue,
    iconAddress,
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
    iconAddress,
    spokeProvider,
    migrationMode,
    currencies.to,
    sonicAddress,
  );
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currencies.from.xChainId);

  const { mutateAsync: migrate, isPending } = useMigrate();
  const handleApprove = async () => {
    await approve();
  };

  // Combine allowance check with approval state for immediate UI feedback
  const hasSufficientAllowance = hasAllowed || isApproved;

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

  // Get chain types for source and destination
  const sourceChainType = getXChainType(direction.from);
  const destinationChainType = getXChainType(direction.to);

  // Get addresses for source and destination chains
  const sourceAddress = getAddressForChain(direction.from);
  const destinationAddress = getAddressForChain(direction.to);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  // Function to determine which chain type to connect to
  const getTargetChainType = (): string | undefined => {
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
      const targetChainType = getTargetChainType();
      if (targetChainType) {
        openWalletModal(targetChainType as 'ICON' | 'EVM' | 'STELLAR' | 'SUI' | 'SOLANA' | 'INJECTIVE');
      }
    }
  };

  return (
    <div className="flex flex-col w-full gap-(--layout-space-comfortable)">
      <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable)">
        <div className="mix-blend-multiply justify-end">
          <span className="text-yellow-dark font-bold leading-9 font-['InterRegular'] !text-(size:--app-title)">
            SODAX{' '}
          </span>
          <span className="text-yellow-dark font-normal font-['Shrikhand'] leading-9 !text-(size:--app-title)">
            migration
          </span>
        </div>
        <ToggleGroup
          type="single"
          value={migrationMode}
          onValueChange={value => {
            if (value && (value === 'icxsoda' || value === 'bnusd')) {
              setMigrationMode(value);
            }
          }}
          className="h-12 w-64 px-1 border border-4 border-cream-white rounded-full mix-blend-multiply"
        >
          <ToggleGroupItem value="icxsoda" className="cursor-pointer">
            ICX & SODA
          </ToggleGroupItem>
          <ToggleGroupItem value="bnusd" className="cursor-pointer">
            bnUSD
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

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
          // onInputChange={e => setTypedValue(e.target.value)}
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
          Takes ~1 min · Network fee:{' '}
          {migrationMode === 'icxsoda'
            ? direction.from === ICON_MAINNET_CHAIN_ID
              ? '~0.02 ICX'
              : '~0.1 SODA'
            : direction.from === ICON_MAINNET_CHAIN_ID
              ? '~0.02 ICX'
              : `~0.1 ${currencies.from.symbol}`}
        </div>

        <div className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <Image src="/symbol_dark.png" alt="" width={16} height={16} />
            </div>
            <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
              {migrationMode === 'icxsoda'
                ? direction.from === ICON_MAINNET_CHAIN_ID
                  ? "You're migrating to Sonic"
                  : "You're migrating back to ICON"
                : `You're migrating bnUSD from ${getChainDisplayName(direction.from)} to ${getChainDisplayName(direction.to)}`}
            </div>
          </div>
          <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
            {migrationMode === 'icxsoda'
              ? direction.from === ICON_MAINNET_CHAIN_ID
                ? "You won't need S token to receive your SODA. But you will for any future transactions on Sonic."
                : 'ICX will be sent to your connected ICON wallet.'
              : direction.to === ICON_MAINNET_CHAIN_ID
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
