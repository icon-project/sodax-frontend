import type React from 'react';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_METHOD } from '../../_stores/stake-store';
import Image from 'next/image';

export default function UnstakeMethodSelectionStep(): React.JSX.Element {
  const { unstakeMethod } = useStakeState();
  const { setUnstakeMethod } = useStakeActions();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] mt-4">
        Choose how to unstake
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.REGULAR)}
          className={`flex items-start gap-3 p-4 rounded-2xl outline-3 outline-cream-white outline-offset-[-3px] transition-all cursor-pointer text-left h-33 ${
            unstakeMethod === UNSTAKE_METHOD.REGULAR
              ? 'outline-cream-white outline-8 outline-offset-[-8px]'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4] flex justify-between items-center">
              Wait 180 Days
              <div className="mt-0.5 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    unstakeMethod === UNSTAKE_METHOD.REGULAR ? 'border-clay-light' : 'border-clay-light'
                  }`}
                >
                  {unstakeMethod === UNSTAKE_METHOD.REGULAR && <div className="w-2 h-2 rounded-full bg-clay-light" />}
                </div>
              </div>
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-medium font-['InterRegular'] leading-[1.4]">
              Get full value, or exit early with up to 50% penalty.
            </div>
            <div className="pt-2 flex justify-start items-center gap-2">
              <div className="bg-white rounded-[256px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.5)] ring ring-2 ring-white flex items-center justify-center overflow-hidden">
                <Image src="/coin/soda.png" alt="SODA" width={16} height={16} />
              </div>
              <div className="flex justify-center gap-1">
                <span className="text-espresso text-xs font-bold font-['InterRegular'] ">3,191.71</span>
                <span className="text-clay text-xs font-normal font-['InterRegular'] "> SODA</span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.INSTANT)}
          className={`flex items-start gap-3 p-4 rounded-2xl outline-3 outline-cream-white outline-offset-[-3px] transition-all cursor-pointer text-left h-33 ${
            unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'outline-cream-white outline-8 outline-offset-[-8px]'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4] flex justify-between items-center">
              Instant Unstake
              <div className="mt-0.5 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    unstakeMethod === UNSTAKE_METHOD.INSTANT ? 'border-cherry-bright' : 'border-clay-light'
                  }`}
                >
                  {unstakeMethod === UNSTAKE_METHOD.INSTANT && <div className="w-2 h-2 rounded-full bg-clay-light" />}
                </div>
              </div>
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-medium font-['InterRegular'] leading-[1.4]">
              Sell your xSODA now at current market rate. No waiting period.
            </div>
            <div className="pt-2 flex justify-start items-center gap-2">
              <div className="bg-white rounded-[256px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.5)] ring ring-2 ring-white flex items-center justify-center overflow-hidden">
                <Image src="/coin/soda.png" alt="SODA" width={16} height={16} />
              </div>
              <div className="flex justify-center gap-1">
                <span className="text-espresso text-xs font-bold font-['InterRegular'] ">3,191.71</span>
                <span className="text-clay text-xs font-normal font-['InterRegular'] ">SODA</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
