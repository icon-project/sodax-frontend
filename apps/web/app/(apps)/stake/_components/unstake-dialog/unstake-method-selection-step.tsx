// apps/web/app/(apps)/stake/_components/unstake-dialog/unstake-method-selection-step.tsx
import type React from 'react';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_METHOD } from '../../_stores/stake-store';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function UnstakeMethodSelectionStep({
  receivedSodaAmount,
}: { receivedSodaAmount: string }): React.JSX.Element {
  const { unstakeMethod } = useStakeState();
  const { setUnstakeMethod } = useStakeActions();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] mt-4">
        Choose how to unstake
      </div>

      <RadioGroup
        value={unstakeMethod}
        onValueChange={value => {
          if (value === UNSTAKE_METHOD.REGULAR || value === UNSTAKE_METHOD.INSTANT) {
            setUnstakeMethod(value);
          }
        }}
        className="grid grid-cols-2 gap-2"
      >
        <div
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.REGULAR)}
          className={`flex items-start gap-3 py-6 px-5 rounded-2xl outline-3 outline-cream-white -outline-offset-3 transition-all cursor-pointer text-left h-33 ${
            unstakeMethod === UNSTAKE_METHOD.REGULAR
              ? 'outline-cream-white outline-8 -outline-offset-8'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4] flex justify-between items-center">
              Wait 180 Days
              <div className="mt-0.5 shrink-0">
                <RadioGroupItem value={UNSTAKE_METHOD.REGULAR} className="w-4 h-4 border-2 border-clay-light" />
              </div>
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-medium font-['InterRegular'] leading-[1.4]">
              Get full value, or exit early with up to 50% penalty.
            </div>
            <div className="flex justify-start items-center gap-2">
              <div className="bg-white rounded-[256px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.5)] ring-2 ring-white flex items-center justify-center overflow-hidden">
                <Image src="/coin/soda.png" alt="SODA" width={16} height={16} />
              </div>
              <div className="flex justify-center gap-1">
                <span className="text-espresso text-xs font-bold font-['InterRegular'] ">{receivedSodaAmount}</span>
                <span className="text-clay text-xs font-normal font-['InterRegular'] "> SODA</span>
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.INSTANT)}
          className={`flex items-start gap-3 py-6 px-5 rounded-2xl outline-3 outline-cream-white -outline-offset-3 transition-all cursor-pointer text-left h-33 ${
            unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'outline-cream-white outline-8 -outline-offset-8'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4] flex justify-between items-center">
              Instant Unstake
              <div className="mt-0.5 shrink-0">
                <RadioGroupItem value={UNSTAKE_METHOD.INSTANT} className="w-4 h-4 border-2 border-clay-light" />
              </div>
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-['InterRegular'] leading-[1.3] font-style-normal font-normal tracking-[-0.5px]">
              Sell your xSODA now at current market rate. No waiting period.
            </div>
            <div className="flex justify-start items-center gap-2">
              <div className="bg-white rounded-[256px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.5)] ring-2 ring-white flex items-center justify-center overflow-hidden">
                <Image src="/coin/soda.png" alt="SODA" width={16} height={16} />
              </div>
              <div className="flex justify-center gap-1">
                <span className="text-espresso text-xs font-bold font-['InterRegular'] ">{receivedSodaAmount}</span>
                <span className="text-clay text-xs font-normal font-['InterRegular'] ">SODA</span>
              </div>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
