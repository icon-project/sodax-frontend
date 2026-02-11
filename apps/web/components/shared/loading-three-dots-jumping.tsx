'use client';

import { motion } from 'motion/react';
import type { ReactElement } from 'react';

function LoadingThreeDotsJumping(): ReactElement {
  return (
    <div className="flex justify-center items-center gap-[2px]">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full bg-clay-light will-change-transform"
          animate={{ y: [2, -4, 2] }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            delay: i * 0.15, // ← creates snake effect
          }}
        />
      ))}
    </div>
  );
}

export default LoadingThreeDotsJumping;
