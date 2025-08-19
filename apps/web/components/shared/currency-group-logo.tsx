import type React from 'react';
import Image from 'next/image';
import type { XToken } from '@sodax/types';

interface CurrencyGroupLogoProps {
  className?: string;
  currency: XToken;
  count?: number;
}

const CurrencyGroupLogo: React.FC<CurrencyGroupLogoProps> = ({ className = '', currency, count = 0 }) => {
  return (
    <div className={`w-16 h-14 relative ${className}`}>
      <div data-property-1="Default" className="w-12 h-12 relative m-auto">
        <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
        <div
          data-property-1="Default"
          className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
        >
          <Image
            className="w-6 h-6 rounded-[256px]"
            src={`/coin/${currency.symbol.toLowerCase()}.png`}
            alt={currency.symbol}
            width={24}
            height={24}
          />
        </div>
        <div
          data-property-1="Counter corss-chain"
          className="w-4 h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.10)] outline outline-2 outline-white inline-flex flex-col justify-center items-center"
        >
          <div className="w-3 h-4 left-[4px] top-0 absolute mix-blend-multiply bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.10)] outline outline-2 outline-white" />
          <div className="left-[7px] top-[3px] absolute inline-flex justify-start items-center">
            <div className="justify-start text-espresso text-[8px] font-medium font-['InterRegular'] leading-[9.60px]">
              {count}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyGroupLogo;
