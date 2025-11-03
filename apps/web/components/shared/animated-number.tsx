'use client';

import { useEffect } from 'react';
import { animate, useMotionValue, useTransform } from 'framer-motion';
import { motion } from 'framer-motion';

interface AnimatedNumberProps {
  to: number;
  duration?: number;
  className?: string;
}

/**
 * AnimatedNumber component that animates from 0 to a target number
 * @param to - Target number to animate to
 * @param duration - Animation duration in seconds (default: 3)
 * @param className - CSS classes to apply to the component
 */
export default function AnimatedNumber({ to, duration = 3, className }: AnimatedNumberProps): JSX.Element {
  const count = useMotionValue(0);
  const rounded = useTransform(() => Math.round(count.get()));

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      onUpdate: (latest: number) => {},
    });
    return () => controls.stop();
  }, [count, to, duration]);

  return <motion.pre className={className}>{rounded}</motion.pre>;
}
