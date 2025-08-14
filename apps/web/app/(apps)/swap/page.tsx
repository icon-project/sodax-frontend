'use client';

import React from 'react';
import CurrencyInputPanel, { CurrencyInputPanelType } from './_components/currency-input-panel';
import { Button } from '@/components/ui/button';
import { SwitchDirectionIcon } from '@/components/icons/switch-direction-icon';

export default function SwapPage() {
  return (
    <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable) w-full">
      <div className="inline-flex flex-col justify-start items-start gap-4">
        <div className="self-stretch mix-blend-multiply justify-end">
          <span className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
            Swap{' '}
          </span>
          <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
            in seconds
          </span>
        </div>
        <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(size:--subtitle)">
          Access 438 assets across ## networks.
        </div>
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-2 w-full">
        <div className="relative w-full">
          <CurrencyInputPanel
            type={CurrencyInputPanelType.INPUT}
            chainId={'sonic'}
            currency={{
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
              xChainId: '0x2105.base',
              address: '0x0000000000000000000000000000000000000000',
            }}
            currencyBalance={0n}
            inputValue={''}
            onInputChange={e => {}}
            onMaxClick={() => {}}
          />

          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            // onClick={switchDirection}
          >
            <SwitchDirectionIcon className="w-4 h-4" />
          </Button>
        </div>

        <CurrencyInputPanel
          type={CurrencyInputPanelType.OUTPUT}
          chainId={'solana'}
          currency={{
            name: 'USDT',
            symbol: 'USDT',
            decimals: 18,
            xChainId: 'solana',
            address: '0x0000000000000000000000000000000000000000',
          }}
          currencyBalance={0n}
          inputValue={''}
          // onInputChange={e => setTypedValue(e.target.value)}
        />
      </div>

      <Button
        variant="cherry"
        className="w-full md:w-[232px] text-(size:--body-comfortable) text-white"
        // onClick={() => openWalletModal()}
      >
        Connect wallets
      </Button>
    </div>
  );
}
