import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '@/components/shared/circular-progress';
import { RoundedPillIcon } from '@/components/icons';

function Frame176({ progress }: { progress: number }) {
  return (
    <div className="box-border content-stretch flex flex-row gap-1.5 items-center justify-center p-0 relative shrink-0">
      <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#483534] text-[14px] text-center text-nowrap">
        <p className="block leading-[1.4] whitespace-pre">Start small to test</p>
      </div>
      <CircularProgress progress={progress} />
    </div>
  );
}

function Bubble({
  progress,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  progress: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col gap-2 items-center justify-center px-8 py-[18px] relative rounded-[32px] shrink-0 cursor-pointer"
      data-name="Bubble"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <Frame176 progress={progress} />
    </div>
  );
}

function Tip() {
  return (
    <div className="h-10 relative w-2" data-name="Tip">
      <RoundedPillIcon width={8} height={40} fill="white" className="block size-full" />
    </div>
  );
}

function Tip1() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-2 items-end justify-start pl-0 pr-8 py-0 relative shrink-0"
      data-name="Tip"
    >
      <div className="flex h-[8px] items-center justify-center relative shrink-0 w-[40px]">
        <div className="flex-none rotate-[270deg]">
          <Tip />
        </div>
      </div>
    </div>
  );
}

interface AnimatedTooltipProps {
  onComplete?: () => void;
}

export function AnimatedTooltip({ onComplete }: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const pauseTimeRef = useRef<number | undefined>(undefined);
  const elapsedWhenPausedRef = useRef<number>(0);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    // Call onComplete after hide animation
    setTimeout(() => {
      onComplete?.();
    }, 300);
  }, [onComplete]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isPaused && progress < 100 && startTimeRef.current) {
      setIsPaused(true);
      pauseTimeRef.current = Date.now();
      // Store how much time had elapsed when we paused
      elapsedWhenPausedRef.current = pauseTimeRef.current - startTimeRef.current;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isPaused && progress < 100) {
      setIsPaused(false);
      // Resume animation from where it left off
      // Set the start time to account for the time that already elapsed
      startTimeRef.current = Date.now() - elapsedWhenPausedRef.current;

      const animate = () => {
        if (!startTimeRef.current || isPaused) return;

        const elapsed = Date.now() - startTimeRef.current;
        const duration = 4000; // 4 seconds for progress
        const newProgress = Math.min((elapsed / duration) * 100, 100);

        setProgress(newProgress);

        if (newProgress < 100) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Hide tooltip after progress completes (only if not hovered)
          setTimeout(() => {
            if (!isHovered) {
              hideTooltip();
            }
          }, 200);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const handleClick = () => {
    hideTooltip();
  };

  useEffect(() => {
    // Start the sequence after 1 second
    const initialTimer = setTimeout(() => {
      setIsVisible(true);

      // Start progress animation after tooltip appears (300ms for appearance animation)
      const progressTimer = setTimeout(() => {
        const now = Date.now();
        startTimeRef.current = now;
        elapsedWhenPausedRef.current = 0;

        const animate = () => {
          if (!startTimeRef.current || isPaused) return;

          const elapsed = Date.now() - startTimeRef.current;
          const duration = 4000; // 4 seconds for progress
          const newProgress = Math.min((elapsed / duration) * 100, 100);

          setProgress(newProgress);

          if (newProgress < 100) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Hide tooltip after progress completes (only if not hovered)
            setTimeout(() => {
              if (!isHovered) {
                hideTooltip();
              }
            }, 200);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }, 300);

      return () => {
        clearTimeout(progressTimer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hideTooltip, isPaused, isHovered]);

  // Handle completion when progress reaches 100% and user stops hovering
  useEffect(() => {
    if (progress >= 100 && !isHovered && isVisible) {
      const timer = setTimeout(() => {
        hideTooltip();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [progress, isHovered, isVisible, hideTooltip]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="bg-transparent box-border content-stretch flex flex-col items-end justify-start p-0 relative size-full"
          data-name="Tooltip"
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.85,
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for subtle expansion
          }}
        >
          <Bubble
            progress={progress}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />
          <Tip1 />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
