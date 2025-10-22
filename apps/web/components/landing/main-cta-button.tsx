import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface MainCtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'yellow-dark' | 'yellow-soda' | 'white' | 'cherry-brighter';
  className?: string;
  children: React.ReactNode;
}

export const MainCtaButton = ({
  variant = 'yellow-dark',
  className,
  children,
  ...props
}: MainCtaButtonProps): React.ReactElement => {
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

  return (
    <div className="inline-flex justify-center items-start relative">
      <Button
        className={cn(
          'w-34 md:w-43 h-10 font-[Shrikhand] rounded-full text-[14px] z-10 pt-[11px] cursor-pointer',
          getBgColor(),
          getTextColor(),
          'transition-all hover:scale-[102%]',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
      <div className="w-4 h-6 absolute -right-4 top-[7px]">
        <div className={cn('w-2 h-2 left-[7px] top-[10px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1 h-1 left-[9px] top-[-8px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1.5 h-1.5 left-[0px] top-[-2px] absolute rounded-full', getBgColor())} />
        <div className={cn('w-1 h-1 left-[12px] top-[1px] absolute rounded-full', getBgColor())} />
      </div>
    </div>
  );
};
