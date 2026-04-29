'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const SUBTITLE_ENTRY_DELAY_S = 2;
const LOGO_ENTRY_DELAY_S = 2.2;
const BACKGROUND_INITIAL_FADE_S = 2;
const BACKGROUND_HOVER_FADE_S = 0.15;

type AnnouncementProps = {
  href: string;
  logo: ReactNode;
  logoLabel: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor?: string;
  className?: string;
  target?: '_blank' | '_self';
  onClick?: () => void;
};

export function Announcement({
  href,
  logo,
  logoLabel,
  subtitle,
  backgroundImage,
  backgroundColor = '#a55c55',
  className,
  target,
  onClick,
}: AnnouncementProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      aria-label={`${logoLabel} — ${subtitle}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn('relative block w-[200px] h-[120px] cursor-pointer overflow-hidden', className)}
      style={{ backgroundColor }}
    >
      <motion.div
        className="absolute inset-0 mix-blend-lighten pointer-events-none bg-[lightgray] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 0.6, scale: isHovered ? 0.94 : 1 }}
        transition={{
          opacity: { duration: hasLoaded ? BACKGROUND_HOVER_FADE_S : BACKGROUND_INITIAL_FADE_S, ease: 'easeOut' },
          scale: { duration: BACKGROUND_HOVER_FADE_S, ease: 'easeOut' },
        }}
        onAnimationComplete={() => setHasLoaded(true)}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      <motion.div
        className="-translate-x-1/2 absolute left-1/2 top-[63px] flex items-center justify-center gap-1"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: isHovered ? 1.04 : 1.024 }}
        transition={{
          delay: SUBTITLE_ENTRY_DELAY_S,
          opacity: { duration: 0.4, ease: 'easeOut' },
          scale: { duration: 0.4, ease: 'easeOut' },
        }}
      >
        <p className="font-[InterBold] text-xs leading-[1.4] text-[#ede6e6] whitespace-nowrap">{subtitle}</p>
        <ArrowUpRightIcon isHovered={isHovered} />
      </motion.div>

      <motion.div
        className="-translate-x-1/2 absolute left-1/2 top-[84px]"
        role="img"
        aria-label={logoLabel}
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: isHovered ? 1.16 : 1.036 }}
        transition={{
          delay: LOGO_ENTRY_DELAY_S,
          opacity: { duration: 0.4, ease: 'easeOut' },
          scale: isHovered
            ? { duration: 0.3, ease: 'easeOut' }
            : { type: 'spring', stiffness: 250, damping: 12, duration: 0.6 },
        }}
      >
        {logo}
      </motion.div>
    </Link>
  );
}

function ArrowUpRightIcon({ isHovered }: { isHovered: boolean }) {
  const stroke = isHovered ? '#B2F3FF' : '#EDE6E6';
  const strokeWidth = isHovered ? 2 : 1.5;
  return (
    <svg className="size-3 shrink-0" fill="none" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <motion.path
        d="M3.5 8.5L8.5 3.5"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <motion.path
        d="M3.5 3.5H8.5V8.5"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
}
