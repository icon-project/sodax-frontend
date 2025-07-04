import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface DecoratedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'yellow-dark' | 'yellow-soda' | 'white' | 'cherry-brighter';
  className?: string;
  address?: string;
  children: React.ReactNode;
  isConnected?: boolean;
  showAddressInfo?: boolean;
}

export const DecoratedButton = ({
  variant = 'yellow-dark',
  isConnected = false,
  showAddressInfo = false,
  address = '',
  className,
  children,
  onClick,
  ...props
}: DecoratedButtonProps): React.ReactElement => {
  const getBgColor = () => {
    switch (variant) {
      case 'yellow-dark':
        return 'bg-yellow-dark hover:bg-yellow-soda';
      case 'yellow-soda':
        return 'bg-yellow-soda hover:bg-yellow-soda/80';
      case 'cherry-brighter':
        return 'bg-cherry-brighter hover:bg-cherry-brighter/80';
      case 'white':
        return 'bg-white hover:bg-white/80';
      default:
        return 'bg-yellow-dark hover:bg-yellow-dark/80';
    }
  };

  const getTextColor = () => {
    return variant === 'white' ? 'text-cherry-soda' : 'text-cherry-dark';
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isConnected) {
      // Navigate to X follow link when connected
      window.open('https://x.com/intent/follow?screen_name=gosodax', '_blank');
    } else {
      // Call the original onClick handler (opens dialog) when not connected
      onClick?.(e);
    }
  };

  return (
    <div className="inline-flex justify-center items-start relative">
      <Button
        className={cn(
          'w-[183px] h-[40px] font-[Shrikhand] rounded-full text-[14px] z-10 pt-[11px]',
          getBgColor(),
          getTextColor(),
          'transition-all hover:scale-[102%]',
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {isConnected ? 'follow us on X' : children}
      </Button>
      {showAddressInfo && (
        <p className="font-[InterRegular] font-medium text-[11px] leading-[140%] tracking-normal text-center text-[#EADED4] bottom-[-20px] absolute">
          {isConnected && address ? (
            <>
              {address.slice(0, 6)}...{address.slice(-6)} is registered.
            </>
          ) : null}
        </p>
      )}
      <div className="w-4 h-6 absolute -right-[15px] top-[0px]">
        <div className={cn('w-2 h-2 left-[7px] top-[10px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1 h-1 left-[9px] top-[-8px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1.5 h-1.5 left-[0px] top-[-2px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1 h-1 left-[12px] top-[1px] absolute rounded-full', getBgColor())} />
      </div>
    </div>
  );
};
