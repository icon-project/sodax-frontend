import type React from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';

interface TokenAssetProps {
  name: string;
  token: XToken;
  isClickBlurred: boolean;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function TokenAsset({
  name,
  token,
  isClickBlurred,
  isHoverDimmed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: TokenAssetProps): React.JSX.Element {
  return (
    <div
      className={`box-border content-stretch flex flex-col gap-2 items-center justify-start px-4 relative cursor-pointer shrink-0 transition-all duration-200 ${
        isClickBlurred ? 'blur filter opacity-30' : isHoverDimmed ? 'opacity-50' : ''
      }`}
      data-name="Asset"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <div className="relative">
        <CurrencyLogo currency={token} />
      </div>
      <div className="relative h-6 w-full">
        <div
          className={`font-['InterRegular'] leading-[0] not-italic absolute inset-0 flex items-center justify-center text-[12px] transition-all duration-200 ${
            isHovered ? 'opacity-100 text-espresso font-bold' : 'opacity-100 text-clay font-medium'
          }`}
        >
          <p className="block leading-[1.4] whitespace-pre">{name}</p>
        </div>
      </div>
    </div>
  );
}
