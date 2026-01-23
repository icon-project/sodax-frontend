'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Toggle visibility when scrolling
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400); // Show button after 400px of scrolling
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // Instead of window.scrollTo, we animate the scroll position this gives us a controlled ease-in-out
    const scrollStep = -window.scrollY / 50; // Adjust '50' for overall speed
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 10);

    const start = window.scrollY;
    const duration = 800; // 0.8 seconds for a luxury feel
    let startTime: number | null = null;

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      // Quadratic Ease-In-Out function
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

      const run = ease(Math.min(timeElapsed / duration, 1)) * start;
      window.scrollTo(0, start - run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 40 }}
          whileHover={{ y: -4 }} // Subtle lift on hover
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className={cn(
            'fixed bottom-8 right-8 z-50 p-4 rounded-full bg-white shadow-2xl',
            'border-[0.5px] border-clay-light/20 text-espresso',
            'hover:bg-vibrant-white transition-colors duration-500 ease-in-out',
          )}
        >
          <ChevronUp className="w-5 h-5 text-clay-light transition-colors duration-500" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
