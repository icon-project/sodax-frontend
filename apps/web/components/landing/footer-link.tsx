import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

interface FooterLinkProps extends ComponentProps<typeof Link> {
  showArrow?: boolean;
  arrowClassName?: string;
}

const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  className,
  showArrow = false,
  arrowClassName,
  ...props
}) => {
  return (
    <Link
      className={cn(
        'group inline-flex items-center gap-2 text-black text-[13px] font-medium font-["InterMedium"] leading-[16px] hover:text-cherry-bright hover:font-bold transition-colors',
        className
      )}
      {...props}
    >
      {children}
      {showArrow && (
        <ArrowUpRight
          width={16}
          height={16}
          className={cn('text-cherry-bright group-hover:stroke-[3.5] transition-all', arrowClassName)}
        />
      )}
    </Link>
  );
};

export { FooterLink }; 