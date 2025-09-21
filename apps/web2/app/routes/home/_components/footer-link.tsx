import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { Link } from 'react-router';

import { cn } from '@/lib/utils';

interface FooterLinkProps {
  children?: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  showArrowDown?: boolean;
  arrowClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  href?: string;
}

const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  className,
  showArrow = false,
  showArrowDown = false,
  arrowClassName,
  onClick,
  href,
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

  // For internal links, use React Router Link component
  return (
    <Link
      className={cn(
        'group inline-flex items-center gap-2 text-black text-[13px] font-medium font-["InterMedium"] leading-[16px] hover:text-cherry-bright hover:font-bold transition-colors',
        className,
      )}
      onClick={onClick}
      to={href || '#'}
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
