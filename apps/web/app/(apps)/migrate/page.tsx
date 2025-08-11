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
import { icxToken, sodaToken } from './_stores/migration-store';
import { formatUnits } from 'viem';
import { useMigrate, useMigrationAllowance, useMigrationApprove } from './_hooks';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSpokeProvider } from '@sodax/dapp-kit';
import { useEvmSwitchChain } from '@sodax/wallet-sdk';

export default function MigratePage() {
  const { openWalletModal } = useWalletUI();
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');

  const { error } = useMigrationInfo();
  const direction = useMigrationStore(state => state.direction);
  const typedValue = useMigrationStore(state => state.typedValue);
  const currencies = useMigrationStore(state => state.currencies);
  const switchDirection = useMigrationStore(state => state.switchDirection);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);

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
  const sodaBalance = sodaBalances?.[sodaToken.address] || 0n;

  const handleMaxClick = () => {
    const value =
      direction.from === ICON_MAINNET_CHAIN_ID ? icxBalance - 1000000000000000000n : sodaBalance - 1000000000000000000n;
    setTypedValue(Number(formatUnits(value, currencies.from.decimals)).toFixed(2));
  };

  const spokeProvider = useSpokeProvider(direction.from);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMigrationAllowance(currencies.from, typedValue, iconAddress, spokeProvider);
  console.log('hasAllowed', hasAllowed);
  const { approve, isLoading: isApproving } = useMigrationApprove(currencies.from, iconAddress, spokeProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currencies.from.xChainId);

  const { mutateAsync: migrate, isPending } = useMigrate();
  const handleApprove = async () => {
    await approve({ amount: typedValue });
  };

  return (
    <div className="flex flex-col w-full" style={{ gap: 'var(--layout-space-comfortable)' }}>
      <div className="inline-flex flex-col justify-start items-start gap-4">
        <div className="mix-blend-multiply justify-end">
          <span className="text-yellow-dark font-bold leading-9 !text-(size:--app-title)">SODAX </span>
          <span className="text-yellow-dark font-normal font-[shrikhand] leading-9 !text-(size:--app-title)">
            migration
          </span>
        </div>
        <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
          Swap 1:1 between ICX and SODA.
        </div>
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-2">
        <div className="relative w-full">
          <CurrencyInputPanel
            type={CurrencyInputPanelType.INPUT}
            chainId={direction.from}
            currency={currencies.from}
            currencyBalance={direction.from === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance}
            inputValue={typedValue}
            onInputChange={e => setTypedValue(e.target.value)}
            onMaxClick={handleMaxClick}
          />

          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            onClick={switchDirection}
          >
            <SwitchDirectionIcon className="w-4 h-4" />
          </Button>
        </div>

        <CurrencyInputPanel
          type={CurrencyInputPanelType.OUTPUT}
          chainId={direction.to}
          currency={currencies.to}
          currencyBalance={direction.to === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance}
          inputValue={typedValue}
        // onInputChange={e => setTypedValue(e.target.value)}
        />
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-4">
        {iconAddress && sonicAddress ? (
          <div className="flex gap-2">
            {isWrongChain ? (
              <Button variant="cherry" onClick={handleSwitchChain}>
                Switch to {direction.from === ICON_MAINNET_CHAIN_ID ? 'ICON' : 'Sonic'}
              </Button>
            ) : (
              <>
                {direction.from === SONIC_MAINNET_CHAIN_ID && <Button
                  className="w-full"
                  type="button"
                  variant="default"
                  onClick={handleApprove}
                  disabled={isAllowanceLoading || hasAllowed || isApproving || !!error}
                >
                  {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
                </Button>}

                <Button
                  className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-[136px] md:w-[232px]
              disabled:opacity-100 disabled:bg-cream-white disabled:text-clay-light
              bg-cherry-soda text-white shadow-xs hover:bg-cherry-soda/90 focus-visible:ring-cherry-soda/20 dark:focus-visible:ring-cherry-soda/40 dark:bg-cherry-soda/60"
                  onClick={async () => {
                    try {
                      await migrate();
                      setShowSuccessDialog(true);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  disabled={isPending || !!error || !hasAllowed || isApproving}
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
            variant="default"
            className="w-full sm:w-[232px] bg-cherry-bright hover:bg-cherry-brighter h-10 cursor-pointer text-(size:--body-comfortable) text-white"
            onClick={() => openWalletModal()}
          >
            Connect wallets
          </Button>
        )}
        <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Takes ~1 min · Network fee: {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : '~0.1 SODA'}
        </div>

        <div className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <Image src="/symbol.png" alt="" width={16} height={16} />
            </div>
            <div className="flex-1 justify-center text-espresso text-base font-bold font-['InterRegular'] text-(size:--body-super-comfortable) leading-tight">
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
