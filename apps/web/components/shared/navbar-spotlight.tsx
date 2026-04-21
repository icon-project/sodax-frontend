'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { KrakenIcon } from '@/components/icons/kraken-icon';

const AUTOPLAY_INITIAL_DELAY_MS = 800;
const AUTOPLAY_HOLD_MS = 2000;
const REVEAL_SPRING = { type: 'spring', damping: 12, stiffness: 100 } as const;
const EXIT_TWEEN = { type: 'tween', duration: 0.3, ease: 'easeIn' } as const;
const TOKEN_STAGGER_S = 0.15;
const AMBIENT_TRANSITION = { duration: 0.3 } as const;
const TEXT_COLOR_TRANSITION = { duration: 0.3 } as const;
const SHIMMER_SWEEP_S = 2.5;
const SHIMMER_REPEAT_DELAY_S = 1.2;
const HIDDEN_OFFSET_X = -50;
const REVEALED_OFFSET_X = -24;
const TEXT_COLOR_IDLE = '#e3bebb';
const TEXT_COLOR_HOVER = '#ffffff';
const SHIMMER_GRADIENT =
  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 35%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.3) 65%, rgba(255,255,255,0) 100%)';

type Phase = 'idle' | 'revealed';

export function NavbarSpotlight({ className = '' }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const initialTimeout = setTimeout(() => {
      if (cancelled) return;
      setPhase('revealed');
      const holdTimeout = setTimeout(() => {
        if (cancelled) return;
        setPhase(currentPhase => (currentPhase === 'revealed' ? 'idle' : currentPhase));
      }, AUTOPLAY_HOLD_MS);
      return () => clearTimeout(holdTimeout);
    }, AUTOPLAY_INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setPhase('revealed');
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setPhase('idle');
  };

  const isRevealed = phase === 'revealed';
  const isShimmerLooping = !isRevealed;

  return (
    <div
      className={`flex items-center gap-2 cursor-pointer py-3 -my-3 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.p
        className="relative font-[InterRegular] text-sm leading-[1.4] whitespace-nowrap"
        initial={false}
        animate={{ color: isHovering ? TEXT_COLOR_HOVER : TEXT_COLOR_IDLE }}
        transition={TEXT_COLOR_TRANSITION}
        style={{ color: TEXT_COLOR_IDLE }}
      >
        Soon on Kraken!
        <motion.span
          aria-hidden
          className="absolute left-0 top-0"
          initial={false}
          animate={{ opacity: isRevealed ? 0 : 1 }}
          transition={AMBIENT_TRANSITION}
        >
          <motion.span
            className="block"
            style={{
              backgroundImage: SHIMMER_GRADIENT,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,1))',
            }}
            animate={
              isShimmerLooping ? { backgroundPosition: ['200% 0%', '0% 0%'] } : { backgroundPosition: '200% 0%' }
            }
            transition={{
              duration: SHIMMER_SWEEP_S,
              repeat: isShimmerLooping ? Number.POSITIVE_INFINITY : 0,
              repeatDelay: SHIMMER_REPEAT_DELAY_S,
              ease: 'easeInOut',
            }}
          >
            Soon on Kraken!
          </motion.span>
        </motion.span>
      </motion.p>

      <motion.div
        className="shrink-0"
        initial={false}
        animate={{ opacity: isRevealed ? 0 : 1 }}
        transition={AMBIENT_TRANSITION}
      >
        <KrakenIcon width={16} height={13} fill="white" />
      </motion.div>

      <motion.span
        className="font-[InterRegular] text-sm leading-[1.4] text-white whitespace-nowrap"
        initial={{ opacity: 0, x: HIDDEN_OFFSET_X }}
        animate={{
          opacity: isRevealed ? 1 : 0,
          x: isRevealed ? REVEALED_OFFSET_X : HIDDEN_OFFSET_X,
        }}
        transition={isRevealed ? REVEAL_SPRING : EXIT_TWEEN}
      >
        → Meet SODA
      </motion.span>

      <motion.div
        className="shrink-0 size-5 rounded-full bg-cherry-on-cherry overflow-hidden flex items-center justify-center"
        initial={{ opacity: 0, x: HIDDEN_OFFSET_X }}
        animate={{
          opacity: isRevealed ? 1 : 0,
          x: isRevealed ? REVEALED_OFFSET_X : HIDDEN_OFFSET_X,
        }}
        transition={
          isRevealed ? { ...REVEAL_SPRING, ...(isHovering ? { delay: TOKEN_STAGGER_S } : {}) } : EXIT_TWEEN
        }
      >
        <Image src="/soda-yellow.png" alt="" width={13} height={13} />
      </motion.div>
    </div>
  );
}

export function NavbarSpotlightStatic({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <p className="font-[InterRegular] text-sm leading-[1.4] text-white whitespace-nowrap">Soon on Kraken!</p>
      <KrakenIcon width={16} height={13} fill="white" />
    </div>
  );
}
