// apps/web/components/landing/lead-magnet-cta.tsx — Homepage lead magnet CTA with Turnstile + email submit
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { ArrowLeft, Send, Check, Loader2, Download } from 'lucide-react';
import { CoffeeCupIcon } from '../icons/coffee-cup-icon';
import { Button } from '@/components/ui/button';
import { LEAD_MAGNET_PDF_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';
import { isValidEmail } from '@/lib/validate-email';
import {
  trackLeadMagnetCtaViewed,
  trackLeadMagnetCtaClicked,
  trackLeadMagnetEmailSubmitted,
  trackLeadMagnetEmailSuccess,
  trackLeadMagnetEmailError,
  trackLeadMagnetPdfDownloaded,
} from '@/lib/analytics';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

enum State {
  Idle = 'idle',
  Input = 'input',
  Sending = 'sending',
  Success = 'success',
  Error = 'error',
}

const MIN_SENDING_MS = 4000;
const PLACEHOLDER_TEXT = 'Enter your email';
const TYPEWRITER_SPEED_MS = 60;
// Delay before the send icon slides in — matches total typewriter duration
const TYPEWRITER_DURATION_S = (PLACEHOLDER_TEXT.length * TYPEWRITER_SPEED_MS) / 1000;
const OVERSHOOT_EASE = [0.34, 1.56, 0.64, 1] as const;

// --- A/B test variants ---

const VARIANTS = [
  { id: 'a', prefix: 'No time? ', cta: "Get the Builder's Guide" },
  { id: 'b', prefix: 'Need a shortcut? ', cta: "Grab the Builder's Guide" },
  { id: 'c', prefix: 'Evaluate later. ', cta: 'Get the free guide' },
  { id: 'd', prefix: 'What does your app need? ', cta: "Get the Builder's Guide" },
  { id: 'e', prefix: 'Level up your product. ', cta: "Get the Builder's Guide" },
] as const;

type Variant = (typeof VARIANTS)[number];

const VARIANT_STORAGE_KEY = 'sodax_lm_variant';

// --- Shared sub-components ---

function BackButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [...OVERSHOOT_EASE] }}
      className="relative z-0 h-12 shrink-0"
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Go back"
        className="group/back relative mr-[-24px] h-12 w-14 shrink-0 rounded-l-[32px] rounded-r-none border-none bg-transparent p-0 outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-l-[32px] rounded-r-none bg-cherry-bright/20 transition-colors duration-300 group-hover/back:bg-cherry-bright/30"
        />

        <ArrowLeft
          className="absolute left-3 top-4 size-4 shrink-0 text-cherry-bright transition-colors duration-300 group-hover/back:text-white"
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
    </motion.div>
  );
}

function SendButton({ isValidEmail, onSubmit }: { isValidEmail: boolean; onSubmit: () => void }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), TYPEWRITER_DURATION_S * 1000 + 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8, y: 8 }}
      animate={{ opacity: isValidEmail ? 1 : 0.4, x: 0, y: 0 }}
      transition={{
        x: { duration: 0.3, delay: isMounted ? 0 : TYPEWRITER_DURATION_S, ease: [...OVERSHOOT_EASE] },
        y: { duration: 0.3, delay: isMounted ? 0 : TYPEWRITER_DURATION_S, ease: [...OVERSHOOT_EASE] },
        opacity: { duration: 0.3, delay: isMounted ? 0 : TYPEWRITER_DURATION_S, ease: 'easeOut' },
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onSubmit}
        disabled={!isValidEmail}
        className="ml-2 mt-2 size-auto bg-transparent outline-none shadow-none hover:bg-transparent"
        aria-label="Send"
      >
        <Send className="size-4 text-white" />
      </Button>
    </motion.div>
  );
}

// Dynamic field sizing — the input pill grows as the user types, capped to avoid overflow.
// Values derived from Figma spec (Inter 16px metrics).
const BASE_INPUT_WIDTH = 140; // min width of the text area (px) — fits ~15 chars comfortably
const CHAR_WIDTH = 9; // average character width at 16px Inter (px)
const FIELD_PADDING = 64; // horizontal padding: 24px (px-6) × 2 + 16px send icon area
const MAX_INPUT_WIDTH = 300; // hard cap so the pill never exceeds the hero on mobile

function EmailInputField({
  inputRef,
  email,
  isValidEmail,
  typedPlaceholder,
  isTyping,
  onEmailChange,
  onKeyDown,
  onSubmit,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  email: string;
  isValidEmail: boolean;
  typedPlaceholder: string;
  isTyping: boolean;
  onEmailChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
}) {
  const inputWidth = Math.max(BASE_INPUT_WIDTH, Math.min(email.length * CHAR_WIDTH + 20, MAX_INPUT_WIDTH));
  const fieldWidth = inputWidth + FIELD_PADDING;

  return (
    <motion.div
      animate={{ width: fieldWidth }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative z-10 flex items-center h-12 rounded-[32px] px-6 shrink-0 bg-cherry-soda"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 border-4 border-cherry-bright rounded-[32px] pointer-events-none"
      />
      <div className="relative flex-1">
        {/* Hidden sizer — measures the actual text width */}
        <span className="invisible whitespace-pre font-[InterRegular] text-base leading-[1.4]">
          {email || typedPlaceholder || ' '}
        </span>
        {!email && (
          <span className="absolute inset-0 flex items-center text-cherry-brighter font-[InterRegular] text-base leading-[1.4] pointer-events-none">
            {typedPlaceholder}
            {typedPlaceholder && <span className="ml-px w-px h-4 bg-white animate-pulse" />}
          </span>
        )}
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Email address"
          className={`absolute inset-0 bg-transparent border-none outline-none text-white font-[InterRegular] text-base leading-[1.4] w-full ${email ? 'caret-white' : 'caret-transparent'}`}
        />
      </div>
      <SendButton isValidEmail={isValidEmail} onSubmit={onSubmit} />
    </motion.div>
  );
}

// --- Main component ---

export const LeadMagnetCTA = (): React.ReactElement => {
  const [state, setState] = useState<State>(State.Idle);
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const turnstileTokenRef = useRef<string | null>(null);

  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const emailValid = isValidEmail(email);

  // A/B variant — resolve from localStorage or assign randomly, track impression
  const [variant, setVariant] = useState<Variant>(VARIANTS[0]);
  useEffect(() => {
    let picked: Variant;
    const stored = localStorage.getItem(VARIANT_STORAGE_KEY);
    const found = VARIANTS.find(v => v.id === stored);
    if (found) {
      picked = found;
    } else {
      picked = VARIANTS[Math.floor(Math.random() * VARIANTS.length)] ?? VARIANTS[0];
      localStorage.setItem(VARIANT_STORAGE_KEY, picked.id);
    }
    setVariant(picked);
    trackLeadMagnetCtaViewed({ variant_id: picked.id });
  }, []);

  // Typewriter effect for placeholder when entering input state
  useEffect(() => {
    if (state !== State.Input && state !== State.Error) {
      setTypedPlaceholder('');
      setIsTyping(false);
      return;
    }
    let i = 0;
    setTypedPlaceholder('');
    setIsTyping(true);
    const interval = setInterval(() => {
      i++;
      if (i > PLACEHOLDER_TEXT.length) {
        clearInterval(interval);
        setIsTyping(false);
        return;
      }
      setTypedPlaceholder(PLACEHOLDER_TEXT.slice(0, i));
    }, TYPEWRITER_SPEED_MS);
    return () => clearInterval(interval);
  }, [state]);

  const handleGetQuickstart = useCallback(() => {
    trackLeadMagnetCtaClicked({ variant_id: variant.id });
    setState(State.Input);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [variant]);

  const handleBack = useCallback(() => {
    setState(State.Idle);
    setEmail('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!emailValid) return;

    setState(State.Sending);
    trackLeadMagnetEmailSubmitted({ variant_id: variant.id });

    try {
      const startTime = Date.now();
      let turnstileToken: string | undefined =
        turnstileTokenRef.current ?? turnstileRef.current?.getResponse() ?? undefined;

      if (TURNSTILE_SITE_KEY && turnstileRef.current) {
        try {
          turnstileToken = await turnstileRef.current.getResponsePromise(45000, 300);
        } catch {
          turnstileToken = turnstileRef.current.getResponse() ?? turnstileTokenRef.current ?? undefined;
        }
      }

      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: turnstileToken ?? null }),
      });

      // Reset Turnstile for potential retry
      turnstileTokenRef.current = null;
      turnstileRef.current?.reset();

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SENDING_MS) {
        await new Promise(r => setTimeout(r, MIN_SENDING_MS - elapsed));
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to send');
      }

      setState(State.Success);
      trackLeadMagnetEmailSuccess({ variant_id: variant.id });
    } catch (err) {
      console.error('[lead-magnet]', err instanceof Error ? err.message : err);
      setState(State.Error);
      trackLeadMagnetEmailError({ variant_id: variant.id });
    }
  }, [email, emailValid, variant]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    },
    [handleSubmit],
  );

  const handleRetry = useCallback(() => {
    setState(State.Input);
    setEmail('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const sharedInputProps = {
    inputRef,
    email,
    isValidEmail: emailValid,
    typedPlaceholder,
    isTyping,
    onEmailChange: setEmail,
    onKeyDown: handleKeyDown,
    onSubmit: handleSubmit,
  };

  const renderContent = () => {
    if (state === State.Idle) {
      return (
        <>
          <a
            href={PARTNERS_ROUTE}
            className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-12 px-6 py-2 rounded-full flex items-center justify-center text-cherry-dark font-[InterBold] text-(length:--body-comfortable) leading-[1.4]"
          >
            Integrate SODAX
          </a>
          <p className="text-sm leading-[1.4]">
            <span className="text-cherry-brighter">{variant.prefix}</span>
            <button
              type="button"
              onClick={handleGetQuickstart}
              className="text-white font-[InterBold] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {variant.cta}
            </button>
          </p>
        </>
      );
    }

    if (state === State.Input) {
      return (
        <>
          <div className="flex items-center justify-center">
            <BackButton onClick={handleBack} />
            <EmailInputField {...sharedInputProps} />
          </div>
          <p className="text-sm leading-[1.4]">
            <span className="text-cherry-brighter">Instant access. </span>
            <span className="text-white font-[InterBold]">No spam</span>
          </p>
        </>
      );
    }

    if (state === State.Sending) {
      return (
        <>
          <div className="flex items-center justify-center">
            <BackButton onClick={handleBack} disabled />
            <div className="relative z-10 flex items-center h-12 rounded-[32px] px-6 min-w-[204px] bg-cherry-soda">
              <div
                aria-hidden="true"
                className="absolute inset-0 border-4 border-cherry-bright rounded-[32px] pointer-events-none"
              />
              <span className="text-white font-[InterRegular] text-base leading-[1.4]">{email}</span>
              <Loader2 className="ml-2 size-4 text-white animate-spin shrink-0" />
            </div>
          </div>
          <p className="text-sm leading-[1.4] text-white font-[InterBold]">On its way...</p>
        </>
      );
    }

    if (state === State.Success) {
      return (
        <>
          <div className="flex items-center justify-center">
            <div className="relative flex items-center h-12 rounded-[32px] px-6 min-w-[204px]">
              <div
                aria-hidden="true"
                className="absolute inset-0 border-4 border-cherry-bright rounded-[32px] pointer-events-none"
              />
              <span className="text-cherry-brighter font-[InterRegular] text-base leading-[1.4]">{email}</span>
              <Check className="ml-2 size-4 text-white shrink-0" />
            </div>
          </div>
          <p className="text-sm leading-[1.4] flex items-center gap-1.5">
            <span className="text-cherry-bright">All set!</span>
            <span className="text-white font-[InterBold]">Open anytime</span>
            <span className="text-cherry-bright">
              <CoffeeCupIcon width={16} height={16} />
            </span>
          </p>
        </>
      );
    }

    // Error state
    return (
      <>
        <div className="flex items-center justify-center">
          <BackButton onClick={handleRetry} />
          <EmailInputField {...sharedInputProps} />
        </div>
        <p className="text-sm leading-[1.4]" role="alert">
          <span className="text-cherry-brighter">Couldn't send. </span>
          <a
            href={LEAD_MAGNET_PDF_ROUTE}
            download
            onClick={() => trackLeadMagnetPdfDownloaded({ variant_id: variant.id })}
            className="text-white font-[InterBold] hover:underline inline-flex items-center gap-1"
          >
            Download instead <Download className="size-3.5" />
          </a>
        </p>
      </>
    );
  };

  return (
    <>
      <div key={state} className="flex flex-col items-center gap-4 animate-fadeIn">
        {renderContent()}
      </div>
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ size: 'invisible', refreshExpired: 'auto', execution: 'render' }}
          onSuccess={token => {
            turnstileTokenRef.current = token;
          }}
          onExpire={() => {
            turnstileTokenRef.current = null;
          }}
          onError={code => {
            console.warn('[lead-magnet] Turnstile error:', code);
            turnstileTokenRef.current = null;
          }}
        />
      )}
    </>
  );
};
