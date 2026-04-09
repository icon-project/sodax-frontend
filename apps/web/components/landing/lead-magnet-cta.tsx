'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { ArrowLeft, Send, Check, Loader2, Download } from 'lucide-react';
import { CoffeeCupIcon } from '../icons/coffee-cup-icon';
import { Button } from '@/components/ui/button';
import { PARTNERS_ROUTE } from '@/constants/routes';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

enum State {
  Idle = 'idle',
  Input = 'input',
  Sending = 'sending',
  Success = 'success',
  Error = 'error',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FAKE_DELAY_MS = 2000;
const PLACEHOLDER_TEXT = 'Enter your email';
const TYPEWRITER_SPEED_MS = 60;
// Delay before the send icon slides in — matches total typewriter duration
const TYPEWRITER_DURATION_S = (PLACEHOLDER_TEXT.length * TYPEWRITER_SPEED_MS) / 1000;
const OVERSHOOT_EASE = [0.34, 1.56, 0.64, 1] as const;

// --- Shared sub-components ---

function BackButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [...OVERSHOOT_EASE] }}
    >
      <Button
        variant="cherry"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className="relative z-10 size-12 -mr-6 rounded-full hover:bg-cherry-bright/20"
        aria-label="Go back"
      >
        <ArrowLeft className="size-4" />
      </Button>
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

// Figma spec: baseInputWidth=140, charWidth≈9, fieldPadding=64 (px-6 * 2 + send icon)
const BASE_INPUT_WIDTH = 140;
const CHAR_WIDTH = 9;
const FIELD_PADDING = 64;
const MAX_INPUT_WIDTH = 300;

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
      className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 shrink-0"
    >
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

  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isValidEmail = EMAIL_REGEX.test(email);

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
    setState(State.Input);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleBack = useCallback(() => {
    setState(State.Idle);
    setEmail('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValidEmail) return;

    setState(State.Sending);

    try {
      const startTime = Date.now();
      const turnstileToken = turnstileRef.current?.getResponse();

      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });

      // Reset Turnstile for potential retry
      turnstileRef.current?.reset();

      const elapsed = Date.now() - startTime;
      if (elapsed < FAKE_DELAY_MS) {
        await new Promise(r => setTimeout(r, FAKE_DELAY_MS - elapsed));
      }

      if (!res.ok) throw new Error('Failed to send');

      setState(State.Success);
    } catch {
      setState(State.Error);
    }
  }, [email, isValidEmail]);

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
    isValidEmail,
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
            <span className="text-cherry-brighter">No time? </span>
            <button
              type="button"
              onClick={handleGetQuickstart}
              className="text-white font-[InterBold] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Get the Builder's Guide
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
            <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px]">
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
            <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px]">
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
          <span className="text-cherry-brighter">Something went wrong. </span>
          <a
            href="/lead-magnet/sodax-builders-guide-to-defi.pdf"
            download
            className="text-white font-[InterBold] hover:underline inline-flex items-center gap-1"
          >
            <Download className="size-3.5" />
            Download directly
          </a>
        </p>
      </>
    );
  };

  return (
    <div key={state} className="flex flex-col items-center gap-4 animate-fadeIn">
      {renderContent()}
      {TURNSTILE_SITE_KEY && (
        <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} options={{ size: 'invisible' }} />
      )}
    </div>
  );
};
