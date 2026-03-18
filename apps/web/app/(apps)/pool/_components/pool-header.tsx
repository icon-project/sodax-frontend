import type React from 'react';

export function PoolHeader(): React.JSX.Element {
  return (
    <div
      data-property-1="Default"
      className="self-stretch mix-blend-multiply flex flex-col justify-start items-start gap-4"
    >
      <div className="self-stretch mix-blend-multiply justify-end">
        <span className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
          Supply{' '}
        </span>
        <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
          liquidity
        </span>
      </div>
      <div className="self-stretch mix-blend-multiply justify-start text-clay-light text-(length:--subtitle) font-normal font-['InterRegular'] leading-5">
        Enable your assets to collect market fees.
      </div>
    </div>
  );
}
