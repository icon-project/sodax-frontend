import type React from 'react';
import Image from 'next/image';
import type { XToken } from '@sodax/types';

interface CurrencyLogoProps {
  className?: string;
  currency: XToken;
  isChainConnected?: boolean;
}

const CurrencyLogo: React.FC<CurrencyLogoProps> = ({ className = '', currency, isChainConnected = false }) => {
  return (
    <div className={`w-12 h-12 relative ${className}`}>
      <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
      <div
        data-property-1="Default"
        className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
      >
        <Image
          className="w-6 h-6 rounded-[256px]"
          src={`/coin/${currency.symbol === 'bnUSD (legacy)' ? 'bnusd' : currency.symbol.toLowerCase()}.png`}
          alt={currency.symbol}
          width={24}
          height={24}
        />
      </div>
      <div
        data-property-1="Active"
        className="h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.40)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
      >
        <Image
          className="w-4 h-4"
          src={`/chain/${currency.xChainId}.png`}
          alt={currency.xChainId}
          width={16}
          height={16}
        />
        {isChainConnected && (
          <div className="absolute -bottom-[2px] -right-[2px] w-[10px] h-[10px] bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
    </div>
  );
};

export default CurrencyLogo;
