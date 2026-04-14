'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { X_INTENT_FOLLOW_ROUTE } from '@/constants/routes';

/** Latest news article CTA — update this when the exchange announcement drops. */
const LATEST_NEWS_URL = '/news/sodax-partners-with-balanced-to-power-a-cross-network-money-market-and-exchange';
import { isValidEmail } from '@/lib/validate-email';

interface RetailFlowProps {
  onBack: () => void;
}

export function RetailFlow({ onBack }: RetailFlowProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [followedX, setFollowedX] = useState(false);

  const emailValid = isValidEmail(email);

  const handleSubmit = async () => {
    if (!emailValid) return;
    setStatus('sending');

    try {
      const res = await fetch('/api/consensus-miami', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'retail' }),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const handleFollowX = () => {
    window.open(X_INTENT_FOLLOW_ROUTE, '_blank', 'noopener,noreferrer');
    setFollowedX(true);
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-300">
        <div className="size-12 rounded-full bg-yellow-dark/20 flex items-center justify-center">
          <Check className="size-6 text-yellow-dark" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white font-[InterBold] text-lg">You&apos;re in</p>
          <p className="text-cherry-brighter text-sm font-[InterRegular] leading-relaxed">
            We&apos;ll keep you in the loop. Check out what we&apos;re building:
          </p>
        </div>
        <Link
          href={`${LATEST_NEWS_URL}?utm_source=consensus-miami&utm_medium=qr&utm_campaign=consensus-2026`}
          className="w-full h-12 rounded-xl bg-yellow-dark hover:bg-yellow-soda text-cherry-dark font-[InterBold] text-sm transition-all hover:scale-[1.02] flex items-center justify-center"
        >
          Read the latest
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-300">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-cherry-brighter text-sm font-[InterRegular] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      {/* Value prop */}
      <p className="text-cherry-brighter text-sm font-[InterRegular] leading-relaxed text-left">
        SODAX is infrastructure for modern money. Swap, lend, borrow, stake, migrate, and bridge across 17+ networks
        from one app at{' '}
        <a href="https://sodax.com" className="text-white underline">
          sodax.com
        </a>
        . No network switching, no fragmented tools. Just DeFi that works across networks.
      </p>

      {/* Follow on X */}
      <button
        type="button"
        onClick={handleFollowX}
        className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-[InterBold] text-sm border border-white/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
      >
        {followedX ? (
          <>
            <Check className="size-4" />
            Following @gosodax
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow @gosodax on X
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-cherry-brighter text-xs font-[InterRegular]">or drop your email</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-3 w-full">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit();
          }}
          className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-white text-sm font-[InterRegular] placeholder:text-cherry-brighter/60 outline-none focus:border-yellow-dark transition-colors"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!emailValid || status === 'sending'}
          className="w-full h-12 rounded-xl bg-yellow-dark hover:bg-yellow-soda text-cherry-dark font-[InterBold] text-sm transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting...
            </>
          ) : status === 'error' ? (
            'Try again'
          ) : (
            'Stay in the loop'
          )}
        </button>
      </div>
    </div>
  );
}
