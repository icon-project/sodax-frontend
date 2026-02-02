'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay 
      }}
      variants={fadeInUp}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedScrollSection({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      variants={fadeInUp}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStaggerContainer({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFadeIn({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      variants={fadeIn}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStaggerChild({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
