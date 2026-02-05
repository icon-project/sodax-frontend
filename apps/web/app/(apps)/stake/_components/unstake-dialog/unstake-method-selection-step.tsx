import type React from 'react';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_METHOD } from '../../_stores/stake-store';

export default function UnstakeMethodSelectionStep(): React.JSX.Element {
  const { unstakeMethod } = useStakeState();
  const { setUnstakeMethod } = useStakeActions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
          Choose how to unstake
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.REGULAR)}
          className={`flex items-start gap-3 p-4 rounded-2xl outline-3 outline-cream-white transition-all cursor-pointer text-left ${
            unstakeMethod === UNSTAKE_METHOD.REGULAR
              ? 'outline-cream-white outline-8 outline-offset-[-8px]'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                unstakeMethod === UNSTAKE_METHOD.REGULAR ? 'border-cherry-bright' : 'border-clay-light'
              }`}
            >
              {unstakeMethod === UNSTAKE_METHOD.REGULAR && (
                <div className="w-2.5 h-2.5 rounded-full bg-cherry-bright" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4]">
              Wait 180 Days
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-medium font-['InterRegular'] leading-[1.4]">
              Get full value, or exit early with up to 50% penalty.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setUnstakeMethod(UNSTAKE_METHOD.INSTANT)}
          className={`flex items-start gap-3 p-4 rounded-2xl outline-3 outline-cream-white transition-all cursor-pointer text-left ${
            unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'outline-cream-white outline-8 outline-offset-[-8px]'
              : 'border-almost-white bg-transparent hover:border-clay-light'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                unstakeMethod === UNSTAKE_METHOD.INSTANT ? 'border-cherry-bright' : 'border-clay-light'
              }`}
            >
              {unstakeMethod === UNSTAKE_METHOD.INSTANT && (
                <div className="w-2.5 h-2.5 rounded-full bg-cherry-bright" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-[1.4]">
              Instant Unstake
            </div>
            <div className="text-clay text-(length:--body-fine-print) font-medium font-['InterRegular'] leading-[1.4]">
              Sell your xSODA now at current market rate. No waiting period.
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
