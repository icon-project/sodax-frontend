'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useWalletUI } from '../_context/wallet-ui';

import {  useXAccount, useXBalances } from '@sodax/wallet-sdk';
import {  SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';

import { SuccessDialog, ErrorDialog } from './_components';
import { SwitchDirectionIcon } from '@/components/icons';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import { useMigrationStore } from './_stores/migration-store-provider';
import { icxToken, sodaToken } from './_stores/migration-store';
import { formatUnits } from 'viem';

export default function MigratePage() {
  const { openWalletModal } = useWalletUI();
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');

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
    const value = direction.from === ICON_MAINNET_CHAIN_ID ? icxBalance-1000000000000000000n : sodaBalance-1000000000000000000n;
    setTypedValue(Number(formatUnits(value, currencies.from.decimals)).toFixed(2));
  }


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
            <Button
              variant="cherry"
              className="w-full bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white w-[136px] md:w-[232px]"
            >
              Migrate
            </Button>
          </div>
        ) : (
          <Button
            variant="cherry"
            className="w-full sm:w-[232px] bg-cherry-bright h-10 cursor-pointer text-(size:--body-comfortable) text-white"
            onClick={() => openWalletModal()}
          >
            Connect wallets
          </Button>
        )}
        <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          Takes ~1 min · Network fee: {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : '~0.1 SODA'}
        </div>

        <div className="self-stretch p-6 mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply"></div>
            <div className="flex-1 justify-center text-Espresso text-base font-bold font-['Inter'] leading-tight">
              {direction.from === ICON_MAINNET_CHAIN_ID ? "You're migrating to Sonic" : "You're migrating back to ICON"}
            </div>
          </div>
          <div className="self-stretch justify-center text-Clay text-xs font-medium font-['Inter'] leading-tight">
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
