'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Send, Check, Loader2, Download } from 'lucide-react';
import { CoffeeCupIcon } from '../icons/coffee-cup-icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PARTNERS_ROUTE } from '@/constants/routes';

type LeadMagnetState = 'idle' | 'input' | 'sending' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FAKE_DELAY_MS = 2000;
const PLACEHOLDER_TEXT = 'Enter your email';
const TYPEWRITER_SPEED_MS = 60;

export const LeadMagnetCTA = (): React.ReactElement => {
  const [state, setState] = useState<LeadMagnetState>('idle');
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isValidEmail = EMAIL_REGEX.test(email);

  // Typewriter effect for placeholder when entering input state
  useEffect(() => {
    if (state !== 'input' && state !== 'error') {
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
    setState('input');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleBack = useCallback(() => {
    setState('idle');
    setEmail('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValidEmail) return;

    setState('sending');

    try {
      const startTime = Date.now();

      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Ensure minimum visual delay so the user sees the spinner
      const elapsed = Date.now() - startTime;
      if (elapsed < FAKE_DELAY_MS) {
        await new Promise(r => setTimeout(r, FAKE_DELAY_MS - elapsed));
      }

      if (!res.ok) throw new Error('Failed to send');

      setState('success');
    } catch {
      setState('error');
    }
  }, [email, isValidEmail]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    },
    [handleSubmit],
  );

  const handleRetry = useCallback(() => {
    setState('input');
    setEmail('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // --- Idle state: CTA button + "Get the Quickstart" link ---
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4">
        <a
          href={PARTNERS_ROUTE}
          className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-12 px-6 py-2 rounded-full flex items-center justify-center text-cherry-dark font-[InterBold] text-(length:--body-comfortable) leading-[1.4]"
        >
          Integrate SODAX
        </a>
        <p className="text-[14px] leading-[1.4]">
          <span className="text-cherry-brighter">No time? </span>
          <button
            type="button"
            onClick={handleGetQuickstart}
            className="text-white font-[InterBold] hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Get the Quickstart
          </button>
        </p>
      </div>
    );
  }

  // --- Input state: email field with back arrow + send icon ---
  if (state === 'input') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center">
          {/* Back button */}
          <Button
            variant="cherry"
            size="icon"
            onClick={handleBack}
            className="relative z-10 size-12 -mr-6 rounded-full hover:bg-cherry-bright/20"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </Button>

          {/* Email input field */}
          <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px] overflow-hidden">
            <div className="relative w-[150px]">
              {!email && (
                <span className="absolute inset-0 flex items-center text-cherry-brighter font-[InterRegular] text-[16px] leading-[1.4] pointer-events-none">
                  {typedPlaceholder}
                  {isTyping && <span className="ml-px w-[2px] h-[16px] bg-white animate-pulse" />}
                </span>
              )}
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-white font-[InterRegular] text-[16px] leading-[1.4] w-full caret-white overflow-hidden text-ellipsis relative"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSubmit}
              disabled={!isValidEmail}
              className={cn(
                'ml-2 size-auto bg-transparent outline-none shadow-none hover:bg-transparent transition-opacity',
                isValidEmail ? 'opacity-100' : 'opacity-40',
              )}
              aria-label="Send"
            >
              <Send className="size-4 text-white" />
            </Button>
          </div>
        </div>
        <p className="text-[14px] leading-[1.4]">
          <span className="text-cherry-brighter">Instant access. </span>
          <span className="text-white font-[InterBold]">No spam</span>
        </p>
      </div>
    );
  }

  // --- Sending state: spinner + "On its way..." ---
  if (state === 'sending') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center">
          <Button
            variant="cherry"
            size="icon"
            disabled
            className="relative z-10 size-12 -mr-6 rounded-full hover:bg-cherry-bright/20"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px]">
            <span className="text-white font-[InterRegular] text-[16px] leading-[1.4] truncate w-[150px]">{email}</span>
            <Loader2 className="ml-2 size-4 text-white animate-spin" />
          </div>
        </div>
        <p className="text-[14px] leading-[1.4] text-white font-[InterBold]">On its way...</p>
      </div>
    );
  }

  // --- Success state: check icon + confirmation ---
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px]">
            <span className="text-cherry-brighter font-[InterRegular] text-[16px] leading-[1.4] truncate w-[150px]">
              {email}
            </span>
            <Check className="ml-2 size-4 text-white" />
          </div>
        </div>
        <p className="text-[14px] leading-[1.4] flex items-center gap-1.5">
          All set!
          <span className="text-white font-[InterBold]"> Open anytime</span>{' '}
          <CoffeeCupIcon width={16} height={16} stroke="white" />
        </p>
      </div>
    );
  }

  // --- Error state: error message + download link + retry ---
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center">
        <Button
          variant="cherry"
          size="icon"
          onClick={handleRetry}
          className="relative z-10 size-12 -mr-6 rounded-full hover:bg-cherry-bright/20"
          aria-label="Try again"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center h-12 rounded-full border-4 border-cherry-bright px-6 min-w-[204px] overflow-hidden">
          <div className="relative w-[150px]">
            {!email && (
              <span className="absolute inset-0 flex items-center text-cherry-brighter font-[InterRegular] text-[16px] leading-[1.4] pointer-events-none">
                {typedPlaceholder}
                {isTyping && <span className="ml-px w-[2px] h-[16px] bg-white animate-pulse" />}
              </span>
            )}
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-white font-[InterRegular] text-[16px] leading-[1.4] w-full caret-white overflow-hidden text-ellipsis relative"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidEmail}
            className={cn(
              'ml-2 flex items-center justify-center transition-opacity cursor-pointer bg-transparent border-none p-0',
              isValidEmail ? 'opacity-100' : 'opacity-40 cursor-default',
            )}
            aria-label="Send"
          >
            <Send className="size-4 text-white" />
          </button>
        </div>
      </div>
      <p className="text-[14px] leading-[1.4]">
        <span className="text-cherry-brighter">Something went wrong. </span>
        <a
          href="/lead-magnet/sodax-quickstart.pdf"
          download
          className="text-white font-[InterBold] hover:underline inline-flex items-center gap-1"
        >
          <Download className="size-3.5" />
          Download directly
        </a>
      </p>
    </div>
  );
};
