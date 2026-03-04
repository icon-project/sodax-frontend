import type React from 'react';
import { PlusCircleIcon, MinusCircleIcon } from 'lucide-react';

export function PriceRangeSelector(): React.JSX.Element {
  return (
    <>
      <div className="inline-flex justify-start items-center gap-(--layout-space-comfortable)">
        <div className="text-right justify-start text-clay text-(length:--body-tiny) font-medium font-['InterRegular'] uppercase leading-3 w-12">
          SELECTED range
        </div>
        <div className="flex justify-start items-center gap-(--layout-space-small)">
          <div className="w-0 h-10 outline outline-cherry-grey" />
          <div className="inline-flex flex-col justify-start items-start">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                Min. price
              </div>
            </div>
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-5">
                0.7182
              </div>
              <button type="button" className="w-4 h-4 relative overflow-hidden" aria-label="Decrease min price">
                <MinusCircleIcon className="w-4 h-4 text-clay-light" />
              </button>
              <button type="button" className="w-4 h-4 relative overflow-hidden" aria-label="Increase min price">
                <PlusCircleIcon className="w-4 h-4 text-clay-light" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-start items-center gap-(--layout-space-small)">
          <div className="w-0 h-10 outline outline-cherry-grey" />
          <div className="inline-flex flex-col justify-start items-start">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
                Max. price
              </div>
            </div>
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-5">
                0.9239
              </div>
              <button type="button" className="w-4 h-4 relative overflow-hidden" aria-label="Decrease max price">
                <MinusCircleIcon className="w-4 h-4 text-clay-light" />
              </button>
              <button type="button" className="w-4 h-4 relative overflow-hidden" aria-label="Increase max price">
                <PlusCircleIcon className="w-4 h-4 text-clay-light" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-4 h-20 left-[40px] top-[12px] absolute origin-top-left -rotate-90"></div>
    </>
  );
}
