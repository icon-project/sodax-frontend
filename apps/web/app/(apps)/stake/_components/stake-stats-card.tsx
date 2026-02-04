// apps/web/app/(apps)/stake/_components/stake-stats-card.tsx
// Stats card component showing xSODA received, APR, and staking statistics

import type React from 'react';
import Image from 'next/image';
import { Info } from 'lucide-react';

export function StakeStatsCard(): React.JSX.Element {
  return (
    <div className="self-stretch p-8 relative flex flex-col justify-start items-start gap-4">
      <div className="self-stretch inline-flex justify-between items-center">
        <div className="flex justify-start items-center gap-3">
          <div data-property-1="Default" className="w-12 h-14 relative">
            <div className="w-14 h-1.5 left-[-4px] top-[50px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full"></div>
            <div className="w-9 h-1 left-[6px] top-[51px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full"></div>
            <Image
              className="w-9 h-14 left-[5px] top-0 absolute"
              src="/coin/xsoda.png"
              alt="xSODA"
              width={36}
              height={56}
              priority
            />
            <Image
              data-property-1="xSODA"
              className="w-5 h-5 left-[14px] top-[14px] absolute mix-blend-multiply rounded-[256px]"
              src="/coin/xsoda.png"
              alt="xSODA"
              width={20}
              height={20}
              priority
            />
          </div>
          <div className="inline-flex flex-col justify-center items-start gap-1">
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-center">
                <span className="text-espresso text-base font-bold font-['Inter'] leading-5">0</span>
                <span className="text-clay text-base font-normal font-['Inter'] leading-5"> xSODA</span>
              </div>
            </div>
            <div className="inline-flex justify-center items-center gap-1">
              <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-4">~0 SODA</div>
              <div className="w-4 h-4 relative overflow-hidden">
                <Info className="w-3.5 h-3.5 text-clay-light" />
              </div>
            </div>
          </div>
        </div>
        <div className="inline-flex flex-col justify-center items-end gap-1">
          <div className="inline-flex justify-end items-center gap-1">
            <div className="justify-center text-espresso text-base font-bold font-['Inter'] leading-5">23.77% APR</div>
            <div className="w-4 h-4 relative overflow-hidden">
              <Info className="w-3.5 h-3.5 text-clay-light" />
            </div>
          </div>
          <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-4">0 total staked</div>
        </div>
      </div>
      <div className="self-stretch h-0.5 relative opacity-30">
        <div className="w-full h-0 left-0 top-[2px] absolute outline outline-[3px] outline-offset-[-1.50px] outline-white"></div>
        <div className="w-full h-0 left-0 top-0 absolute outline outline-1 outline-offset-[-0.50px] outline-clay"></div>
      </div>
      <div className="self-stretch inline-flex justify-between items-center">
        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="justify-center text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            STAKING NOW
          </div>
          <div className="inline-flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-xs font-bold font-['Inter'] leading-5">0</div>
          </div>
        </div>
        <div className="inline-flex flex-col justify-center items-end gap-1">
          <div className="justify-center text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            UNSTAKING PERIOD
          </div>
          <div className="inline-flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-xs font-bold font-['Inter'] leading-5">0</div>
            <div className="w-4 h-4 relative overflow-hidden">
              <Info className="w-3.5 h-3.5 text-clay-light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
