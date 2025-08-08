// apps/web/components/ui/network-display.tsx
import type React from 'react';

interface NetworkDisplayProps {
  iconSrc: string;
  secondaryIconSrc?: string;
  label: string;
  description: string;
  className?: string;
}

const NetworkDisplay: React.FC<NetworkDisplayProps> = ({
  iconSrc,
  secondaryIconSrc,
  label,
  description,
  className = '',
}: NetworkDisplayProps) => {
  return (
    <div className={`flex justify-start items-center gap-2 ${className}`}>
      <div className="w-16 h-14 relative">
        <div data-property-1="Default" className="w-12 h-12 left-[8px] top-[4px] absolute">
          <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
          <div
            data-property-1="Default"
            className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
          >
            <img data-property-1="ICX" className="w-6 h-6 rounded-[256px]" src={iconSrc} alt={label} />
          </div>
          {secondaryIconSrc && (
            <div
              data-property-1="Active"
              className="h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.40)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
            >
              <img data-property-1="ICON" className="w-4 h-4" src={secondaryIconSrc} alt={`${label} secondary`} />
            </div>
          )}
        </div>
      </div>
      <div className="inline-flex flex-col justify-center items-start gap-1">
        <div className="justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
          {description}
        </div>
        <div className="justify-center text-espresso font-['InterRegular'] leading-snug text-(size:--body-super-comfortable) inline-flex gap-1">
          {label}
          <span className="hidden md:inline">Network</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkDisplay;
