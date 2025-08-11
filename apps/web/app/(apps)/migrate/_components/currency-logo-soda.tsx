import React from 'react';

interface CurrencyLogoSodaProps {
  className?: string;
}

const CurrencyLogoSoda: React.FC<CurrencyLogoSodaProps> = ({ className = '' }) => {
  return (
    <div className={`w-16 h-14 relative ${className}`}>
        <div data-property-1="Default" className="w-12 h-12 left-[8px] top-[4px] absolute">
          <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
          <div
            data-property-1="Default"
            className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
          >
            <img className="w-6 h-6 rounded-[256px]" src="/coin/soda.png" alt="SODA" />
          </div>
            <div
              data-property-1="Active"
              className="h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.40)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
            >
              <img className="w-4 h-4" src="/coin/s1.png" alt="SODA" />
            </div>
        </div>
      </div>
  );
};

export default CurrencyLogoSoda;
