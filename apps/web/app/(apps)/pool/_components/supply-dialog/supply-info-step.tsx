import type React from 'react';

export default function SupplyInfoStep(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterBold'] leading-[1.4]">
          You’ll provide liquidity
        </div>
        <div className="self-stretch text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
          Earn protocol fees from market activity.
        </div>
      </div>

      <div className="self-stretch inline-flex justify-start items-start gap-4">
        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterBold'] leading-[1.4]">
            Fees are variable
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
            Returns adjust in real-time based on trade activity.
          </div>
        </div>

        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterBold'] leading-[1.4]">
            Monitor your position
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
            Active only while price remains within range.
          </div>
        </div>
      </div>
    </div>
  );
}
