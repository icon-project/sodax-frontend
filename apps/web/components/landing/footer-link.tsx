import { ArrowUpRight, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

interface FooterLinkProps extends ComponentProps<typeof Link> {
  showArrow?: boolean;
  showArrowDown?: boolean;
  arrowClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  className,
  showArrow = false,
  showArrowDown = false,
  arrowClassName,
  onClick,
  href,
  ...props
}) => {
  // Check if the link is external (starts with http:// or https://)
  const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));

  // If it's an external link, render as a regular anchor tag
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group inline-flex items-center gap-2 text-black text-[13px] font-medium font-["InterMedium"] leading-[16px] hover:text-cherry-bright hover:font-bold transition-colors',
          className,
        )}
        onClick={onClick}
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
        {showArrowDown && (
          <ArrowDown
            width={16}
            height={16}
            className={cn('text-cherry-bright group-hover:stroke-[3.5] transition-all', arrowClassName)}
          />
        )}
      </a>
    );
  }

  // For internal links, use Next.js Link component
  return (
    <Link
      className={cn(
        'group inline-flex items-center gap-2 text-black text-[13px] font-medium font-["InterMedium"] leading-[16px] hover:text-cherry-bright hover:font-bold transition-colors',
        className,
      )}
      onClick={onClick}
      href={href}
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
      {showArrowDown && (
        <ArrowDown
          width={16}
          height={16}
          className={cn('text-cherry-bright group-hover:stroke-[3.5] transition-all', arrowClassName)}
        />
      )}
    </Link>
  );
};

export { FooterLink };
