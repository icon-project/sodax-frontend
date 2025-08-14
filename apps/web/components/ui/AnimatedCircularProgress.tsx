import { motion } from 'framer-motion';
import svgPaths from '@/components/ui/imports/svg-wvqxyi2334';

interface AnimatedCircularProgressProps {
  progress: number;
}

export function AnimatedCircularProgress({ progress }: AnimatedCircularProgressProps) {
  const radius = 4.25; // Calculated from the original 12px viewBox minus strokeWidth
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
            d={svgPaths.p751100}
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
