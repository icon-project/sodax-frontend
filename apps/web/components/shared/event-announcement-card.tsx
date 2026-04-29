'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

const SUBTITLE_ENTRY_DELAY_S = 2;
const LOGO_ENTRY_DELAY_S = 2.2;
const BACKGROUND_INITIAL_FADE_S = 2;
const BACKGROUND_HOVER_FADE_S = 0.15;

type EventAnnouncementCardProps = {
  href: string;
  logo: ReactNode;
  logoLabel: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor?: string;
  className?: string;
  target?: '_blank' | '_self';
};

export function EventAnnouncementCard({
  href,
  logo,
  logoLabel,
  subtitle,
  backgroundImage,
  backgroundColor = '#a55c55',
  className,
  target,
}: EventAnnouncementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      aria-label={`${logoLabel} — ${subtitle}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={className}
    >
      <div className="relative w-[200px] h-[120px] cursor-pointer overflow-hidden" style={{ backgroundColor }}>
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
      </div>
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

function ConsensusLogo() {
  return (
    <svg
      width="110"
      height="12"
      viewBox="0 0 110 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="block"
    >
      <path
        d="M104.469 11.9997C101.125 11.9997 99.1083 10.4916 99.0757 7.93423H102.518C102.567 8.95062 103.272 9.55716 104.469 9.55716C105.731 9.55716 106.469 9.09813 106.469 8.32772C106.469 6.1638 99.0757 8.86865 99.0757 3.50812C99.0757 1.31145 101.059 0 104.403 0C107.764 0 109.764 1.60652 109.797 4.34416H106.354C106.321 3.16386 105.568 2.44257 104.338 2.44257C102.879 2.44257 102.355 2.98354 102.355 3.63927C102.355 5.95069 109.912 3.70484 109.912 7.93423C109.912 10.4916 107.895 11.9997 104.469 11.9997Z"
        fill="#B2F3FF"
      />
      <path
        d="M91.9985 11.9998C88.5234 11.9998 86.4741 9.93428 86.4741 6.45893V0.311523H89.9166V6.45893C89.9166 7.96709 90.6871 8.88508 91.9985 8.88508C93.294 8.88508 94.0645 7.96709 94.0645 6.45893V0.311523H97.507V6.45893C97.507 9.93428 95.4577 11.9998 91.9985 11.9998Z"
        fill="#B2F3FF"
      />
      <path
        d="M79.4628 11.9997C76.118 11.9997 74.102 10.4916 74.0694 7.93423H77.5119C77.5612 8.95062 78.2658 9.55716 79.4628 9.55716C80.7249 9.55716 81.4621 9.09813 81.4621 8.32772C81.4621 6.1638 74.0694 8.86865 74.0694 3.50812C74.0694 1.31145 76.0528 0 79.3969 0C82.7576 0 84.7577 1.60652 84.7903 4.34416H81.3477C81.3151 3.16386 80.5606 2.44257 79.3317 2.44257C77.8726 2.44257 77.3476 2.98354 77.3476 3.63927C77.3476 5.95069 84.9047 3.70484 84.9047 7.93423C84.9047 10.4916 82.8887 11.9997 79.4628 11.9997Z"
        fill="#B2F3FF"
      />
      <path
        d="M61.4675 5.57427C61.4675 2.09894 63.5166 0.0498047 66.9919 0.0498047C70.4507 0.0498047 72.5 2.09894 72.5 5.57427V11.7381H69.0574V5.57427C69.0574 4.06611 68.287 3.16449 66.9919 3.16449C65.6805 3.16449 64.91 4.06611 64.91 5.57427V11.7381H61.4675V5.57427Z"
        fill="#B2F3FF"
      />
      <path
        d="M49.8166 0.262695H59.7671V2.70527H53.2591V4.77079H59.4065V7.21334H53.2591V9.2953H59.8983V11.7379H49.8166V0.262695Z"
        fill="#B2F3FF"
      />
      <path
        d="M42.8048 11.9997C39.4606 11.9997 37.4442 10.4916 37.4114 7.93423H40.854C40.9032 8.95062 41.6081 9.55716 42.8048 9.55716C44.0671 9.55716 44.8047 9.09813 44.8047 8.32772C44.8047 6.1638 37.4114 8.86865 37.4114 3.50812C37.4114 1.31145 39.395 0 42.7392 0C46.0998 0 48.0998 1.60652 48.1325 4.34416H44.69C44.6572 3.16386 43.9031 2.44257 42.6737 2.44257C41.2147 2.44257 40.6901 2.98354 40.6901 3.63927C40.6901 5.95069 48.2473 3.70484 48.2473 7.93423C48.2473 10.4916 46.2309 11.9997 42.8048 11.9997Z"
        fill="#B2F3FF"
      />
      <path
        d="M24.8098 5.57427C24.8098 2.09894 26.8589 0.0498047 30.3342 0.0498047C33.7932 0.0498047 35.8423 2.09894 35.8423 5.57427V11.7381H32.3997V5.57427C32.3997 4.06611 31.6292 3.16449 30.3342 3.16449C29.0228 3.16449 28.2523 4.06611 28.2523 5.57427V11.7381H24.8098V5.57427Z"
        fill="#B2F3FF"
      />
      <path
        d="M17.8148 12.0004C14.4214 12.0004 12.405 10.066 12.405 6.77094V5.2792C12.405 1.98419 14.4214 0.0498047 17.8148 0.0498047C21.2245 0.0498047 23.2409 1.98419 23.2409 5.2792V6.77094C23.2409 10.066 21.2245 12.0004 17.8148 12.0004ZM15.8476 6.77094C15.8476 8.24637 16.5853 9.11519 17.8148 9.11519C19.0607 9.11519 19.7983 8.24637 19.7983 6.77094V5.2792C19.7983 3.80382 19.0607 2.93499 17.8148 2.93499C16.5853 2.93499 15.8476 3.80382 15.8476 5.2792V6.77094Z"
        fill="#B2F3FF"
      />
      <path
        d="M5.40973 12.0004C2.01636 12.0004 0 10.066 0 6.77094V5.2792C0 1.98419 2.01636 0.0498047 5.40973 0.0498047C8.81953 0.0498047 10.8358 1.98419 10.8358 5.2792H7.39327C7.39327 3.80382 6.65559 2.93499 5.40973 2.93499C4.18025 2.93499 3.44256 3.80382 3.44256 5.2792V6.77094C3.44256 8.24637 4.18025 9.11519 5.40973 9.11519C6.65559 9.11519 7.39327 8.24637 7.39327 6.77094H10.8358C10.8358 10.066 8.81953 12.0004 5.40973 12.0004Z"
        fill="#B2F3FF"
      />
    </svg>
  );
}

export function ConsensusMiamiAnnouncement({ className }: { className?: string }) {
  return (
    <EventAnnouncementCard
      href="https://luma.com/00kpa20f?tk=cCSs90"
      target="_blank"
      logo={<ConsensusLogo />}
      logoLabel="Consensus"
      subtitle="In Miami for"
      backgroundImage="/consensus_miami.png"
      className={className}
    />
  );
}
