import type React from 'react';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_METHOD } from '../../_stores/stake-store';
import { Label } from '@/components/ui/label';

export default function UnstakeMethodSelectionStep(): React.JSX.Element {
  const { unstakeMethod } = useStakeState();
  const { setUnstakeMethod } = useStakeActions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
          Choose Unstake Method
        </div>
        <div className="self-stretch text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
          Select how you want to unstake your xSODA tokens.
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="regular-unstake"
            name="unstake-method"
            value={UNSTAKE_METHOD.REGULAR}
            checked={unstakeMethod === UNSTAKE_METHOD.REGULAR}
            onChange={() => setUnstakeMethod(UNSTAKE_METHOD.REGULAR)}
            className="w-4 h-4 text-cherry-bright focus:ring-cherry-bright"
          />
          <Label htmlFor="regular-unstake" className="cursor-pointer flex-1">
            <div className="flex flex-col gap-1">
              <div className="text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
                Wait 180 Days (Regular Unstake)
              </div>
              <div className="text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
                Unstake and wait 180 days to receive full value. No fees, but requires waiting period.
              </div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="instant-unstake"
            name="unstake-method"
            value={UNSTAKE_METHOD.INSTANT}
            checked={unstakeMethod === UNSTAKE_METHOD.INSTANT}
            onChange={() => setUnstakeMethod(UNSTAKE_METHOD.INSTANT)}
            className="w-4 h-4 text-cherry-bright focus:ring-cherry-bright"
          />
          <Label htmlFor="instant-unstake" className="cursor-pointer flex-1">
            <div className="flex flex-col gap-1">
              <div className="text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
                Instant Unstake
              </div>
              <div className="text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
                Unstake immediately without waiting. May have different exchange rate.
              </div>
            </div>
          </Label>
        </div>
      </div>
    </div>
  );
}
