'use client';

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  to: number;
  duration?: number;
  className?: string;
  decimalPlaces?: number;
}

/**
 * AnimatedNumber component that animates from 0 to a target number
 * @param to - Target number to animate to
 * @param duration - Animation duration in seconds (default: 3)
 * @param className - CSS classes to apply to the component
 * @param decimalPlaces - Number of decimal places to display (undefined keeps rounding to the nearest integer)
 */
export default function AnimatedNumber({
  to,
  duration = 3,
  className,
  decimalPlaces,
}: AnimatedNumberProps): React.ReactElement {
  const count = useMotionValue(0);
  const formatted = useTransform(count, (value: number) => {
    const distanceLeft = Math.abs(to - value);

    // Step smaller as we approach the target
    const step = Math.max(0.1, distanceLeft / 20);
    const displayValue = Math.round(value / step) * step;

    return decimalPlaces !== undefined ? displayValue.toFixed(decimalPlaces) : Math.round(displayValue).toString();
  });

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [count, to, duration]);

  return <motion.pre className={className}>{formatted}</motion.pre>;
}
