import type React from 'react';
import Image from 'next/image';
import type { XToken } from '@sodax/types';

interface CanLogoProps {
  className?: string;
  currency: XToken;
  isChainConnected?: boolean;
  hideNetworkIcon?: boolean;
}

const CanLogo: React.FC<CanLogoProps> = ({
  className = '',
  currency,
  isChainConnected = false,
  hideNetworkIcon = false,
}) => {
  return (
    <div data-property-1="Default" className="w-12 h-14 relative">
      <div className="w-12 h-1.5 left-0 top-[50px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full" />
      <div className="w-9 h-1 left-[10px] top-[51px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full" />
      <Image className="left-[5px] top-0 absolute" src="/can1.png" alt="CAN" width={38} height={56} />
      <Image
        data-property-1="bnUSD"
        className="w-5 h-5 left-[14px] top-[14px] absolute mix-blend-multiply rounded-[256px]"
        src={`/coin/${currency.symbol.toLowerCase()}.png`}
        alt="bnUSD"
        width={20}
        height={20}
      />
      {!hideNetworkIcon && (
        <div data-property-1="Medium" className="w-4 h-4 left-[31px] top-[36px] absolute">
          <div
            data-property-1="Default"
            className="h-4 left-0 top-0 absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.10)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
          >
            <Image
              data-property-1="Sonic"
              className="w-4 h-4"
              src={`/chain/${currency.xChainId}.png`}
              alt={currency.xChainId}
              width={16}
              height={16}
            />
          </div>
          {isChainConnected && (
            <div className="w-2.5 h-2.5 left-[8px] top-[8px] absolute bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
      )}
    </div>
  );
};
export default CanLogo;
