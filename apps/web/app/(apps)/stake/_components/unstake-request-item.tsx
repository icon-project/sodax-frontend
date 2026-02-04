import type React from 'react';
import XCircleIcon from '../_icons/x-circle-icon';
import MinusCircleIcon from '../_icons/minus-circle-icon';
// import CheckCircleIcon from '../_icons/check-circle-icon';

export function UnstakeRequestItem(): React.JSX.Element {
  return (
    <div className="w-full inline-flex flex-col justify-start items-start gap-4">
      <div className="w-full flex flex-col justify-start items-start gap-1">
        <div className="inline-flex justify-start items-center gap-2">
          <div className="justify-center text-clay text-(length:--body-super-comfortable) font-normal font-['Inter'] leading-5">
            180 days left
          </div>
          <div className="w-4 h-4 relative overflow-hidden">
            <div className="w-[1.33px] h-[1.33px] left-[7.33px] top-[8px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-Clay-light" />
            <div className="w-[1.33px] h-[1.33px] left-[12px] top-[7.33px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-Clay-light" />
            <div className="w-[1.33px] h-[1.33px] left-[2.67px] top-[6.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-Clay-light" />
          </div>
        </div>

        <div className="w-full inline-flex justify-between items-center">
          <div className="justify-center">
            <span className="text-espresso text-(length:--body-small) font-bold font-['Inter'] leading-4">
              1,595.2821
            </span>
            <span className="text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
              {' '}
              / 3,191.71 SODA
            </span>
          </div>
          <div className="justify-center text-clay text-(length:--body-fine-print) font-normal font-['Inter'] leading-3">
            2026-06-12
          </div>
        </div>
      </div>

      <div className="w-full h-1 bg-blend-multiply bg-almost-white rounded-[40px] flex flex-col justify-start items-start gap-2">
        <div className="w-full h-1 bg-clay-light rounded-[40px]" />
      </div>

      <div className="inline-flex justify-start items-center gap-4">
        <div className="rounded-2xl flex justify-center items-center gap-1">
          <MinusCircleIcon />
          <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
            Claim early –50%
          </div>
        </div>
        <div className="rounded-2xl flex justify-center items-center gap-1">
          <XCircleIcon />
          <div className="justify-start text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">
            Cancel
          </div>
        </div>
      </div>
    </div>
  );
}
