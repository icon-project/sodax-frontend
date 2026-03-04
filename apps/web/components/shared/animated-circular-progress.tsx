import { motion } from 'framer-motion';

interface AnimatedCircularProgressProps {
  progress: number;
}

export function AnimatedCircularProgress({ progress }: AnimatedCircularProgressProps) {
  const radius = 4.25; // Calculated from the original 12px viewBox minus strokeWidth

  return (
    <div className="relative shrink-0 size-3" data-name="icon/loader-2">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 12 12"
        aria-label="Animated circular progress"
      >
        <title>Animated circular progress</title>
        <g clipPath="url(#clip0_1_106)" id="icon/loader-2">
          {/* Background circle (static) */}
          <circle cx="6" cy="6" r={radius} stroke="#B9ACAB" strokeWidth="1.5" fill="none" opacity={0.3} />
          {/* Animated progress circle */}
          <motion.path
            d="M10.5 5.9999C10.5 6.95019 10.1991 7.87608 9.64047 8.64486C9.08187 9.41364 8.29423 9.98585 7.39044 10.2795C6.48665 10.5731 5.5131 10.5731 4.60932 10.2794C3.70555 9.98572 2.91794 9.41346 2.35938 8.64465C1.80083 7.87584 1.49999 6.94994 1.5 5.99964C1.50001 5.04935 1.80085 4.12345 2.35942 3.35465C2.91799 2.58584 3.7056 2.0136 4.60938 1.71993C5.51316 1.42627 6.48671 1.42625 7.3905 1.7199"
            id="Vector"
            stroke="#B9ACAB"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - progress / 100}
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 1 - progress / 100 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </g>
        <defs>
          <clipPath id="clip0_1_106">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
