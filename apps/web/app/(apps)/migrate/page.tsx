'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useWalletUI } from '../_context/wallet-ui';

import { useXAccount, useXBalances } from '@sodax/wallet-sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';

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
  const direction = useMigrationStore(state => state.direction);
  const typedValue = useMigrationStore(state => state.typedValue);
  const currencies = useMigrationStore(state => state.currencies);
  const migrationMode = useMigrationStore(state => state.migrationMode);
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

  const { data: iconBnusdBalances } = useXBalances({
    xChainId: ICON_MAINNET_CHAIN_ID,
    xTokens: [iconBnusdToken],
    address: iconAddress,
  });
  const iconBnusdBalance = iconBnusdBalances?.[iconBnusdToken.address] || 0n;

  const { data: sonicBnusdBalances } = useXBalances({
    xChainId: SONIC_MAINNET_CHAIN_ID,
    xTokens: [sonicBnusdToken],
    address: sonicAddress,
  });
  const sonicBnusdBalance = BigInt(sonicBnusdBalances?.[sonicBnusdToken.address] || 0);

  const handleMaxClick = () => {
    let value: bigint;
    if (migrationMode === 'icxsoda') {
      value = direction.from === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance;
    } else {
      value = direction.from === ICON_MAINNET_CHAIN_ID ? iconBnusdBalance : sonicBnusdBalance;
    }
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
  } = useMigrationApprove(currencies.from, typedValue, iconAddress, spokeProvider, migrationMode, currencies.to);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currencies.from.xChainId);

  const { mutateAsync: migrate, isPending } = useMigrate();
  const handleApprove = async () => {
    await approve();
  };

  // Combine allowance check with approval state for immediate UI feedback
  const hasSufficientAllowance = hasAllowed || isApproved;

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
            currencyBalance={
              migrationMode === 'icxsoda'
                ? direction.from === ICON_MAINNET_CHAIN_ID
                  ? icxBalance
                  : sodaBalance
                : direction.from === ICON_MAINNET_CHAIN_ID
                  ? iconBnusdBalance
                  : sonicBnusdBalance
            }
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
          currencyBalance={
            migrationMode === 'icxsoda'
              ? direction.to === ICON_MAINNET_CHAIN_ID
                ? icxBalance
                : sodaBalance
              : direction.to === ICON_MAINNET_CHAIN_ID
                ? iconBnusdBalance
                : sonicBnusdBalance
          }
          inputValue={typedValue}
          onChainSelect={(chainId, token) => setChainForCurrency('to', chainId, token)}
          // onInputChange={e => setTypedValue(e.target.value)}
        />
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-4">
        {iconAddress && sonicAddress ? (
          <div className="flex gap-2">
            {isWrongChain ? (
              <Button
                variant="cherry"
                className="w-[136px] md:w-[232px] text-(size:--body-comfortable) text-white"
                onClick={handleSwitchChain}
              >
                Switch to {direction.from === ICON_MAINNET_CHAIN_ID ? 'ICON' : 'Sonic'}
              </Button>
            ) : (
              <>
                {direction.from === SONIC_MAINNET_CHAIN_ID && (
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
                    (direction.from === SONIC_MAINNET_CHAIN_ID && (!hasSufficientAllowance || isApproving))
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
            onClick={() => openWalletModal()}
          >
            Connect wallets
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
              : '~0.1 bnUSD'}
        </div>

        <div className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <Image src="/symbol_dark.png" alt="" width={16} height={16} />
            </div>
            <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
              {direction.from === ICON_MAINNET_CHAIN_ID
                ? `You're migrating ${migrationMode === 'icxsoda' ? 'to Sonic' : 'bnUSD to Sonic'}`
                : `You're migrating ${migrationMode === 'icxsoda' ? 'back to ICON' : 'bnUSD back to ICON'}`}
            </div>
          </div>
          <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
            {direction.from === ICON_MAINNET_CHAIN_ID
              ? migrationMode === 'icxsoda'
                ? "You won't need S token to receive your SODA. But you will for any future transactions on Sonic."
                : "You won't need S token to receive your bnUSD. But you will for any future transactions on Sonic."
              : migrationMode === 'icxsoda'
                ? 'ICX will be sent to your connected ICON wallet.'
                : 'bnUSD will be sent to your connected ICON wallet.'}
          </div>
        </div>
      </div>

      <SuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
      <ErrorDialog open={showErrorDialog} onOpenChange={setShowErrorDialog} errorMessage={migrationError} />
    </div>
  );
}
