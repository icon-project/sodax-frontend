'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DOCUMENTATION_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';
import { isValidEmail } from '@/lib/validate-email';

const ROLES = ['Founder', 'Developer', 'BD', 'Other'] as const;

interface ProjectFlowProps {
  onBack: () => void;
}

export function ProjectFlow({ onBack }: ProjectFlowProps) {
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const emailValid = isValidEmail(email);

  const handleSubmit = async () => {
    if (!emailValid) return;
    setStatus('sending');

    try {
      const res = await fetch('/api/consensus-miami', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'project',
          projectName: projectName || undefined,
          role: role || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-300">
        <div className="size-12 rounded-full bg-yellow-dark/20 flex items-center justify-center">
          <Check className="size-6 text-yellow-dark" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white font-[InterBold] text-lg">You&apos;re on our list</p>
          <p className="text-cherry-brighter text-sm font-[InterRegular] leading-relaxed">
            We&apos;ll follow up after the event. In the meantime:
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link
            href={`${DOCUMENTATION_ROUTE}?utm_source=consensus-miami&utm_medium=qr&utm_campaign=consensus-2026`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-[InterBold] text-sm border border-white/20 transition-all flex items-center justify-center"
          >
            Explore the SDK docs
          </Link>
          <Link
            href={`${PARTNERS_ROUTE}?utm_source=consensus-miami&utm_medium=qr&utm_campaign=consensus-2026`}
            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-[InterBold] text-sm border border-white/20 transition-all flex items-center justify-center"
          >
            View partner page
          </Link>
        </div>
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
        SODAX is infrastructure for modern money. Cross-network execution and liquidity for builders and networks, live
        across 17+ networks.
      </p>

      {/* Form */}
      <div className="flex flex-col gap-3 w-full">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email *"
          className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-white text-sm font-[InterRegular] placeholder:text-cherry-brighter/60 outline-none focus:border-yellow-dark transition-colors"
        />
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Project / protocol name"
          className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-white text-sm font-[InterRegular] placeholder:text-cherry-brighter/60 outline-none focus:border-yellow-dark transition-colors"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-sm font-[InterRegular] outline-none focus:border-yellow-dark transition-colors appearance-none cursor-pointer"
          style={{ color: role ? 'white' : 'rgba(227, 190, 187, 0.6)' }}
        >
          <option value="" disabled className="bg-cherry-soda text-cherry-brighter">
            Role
          </option>
          {ROLES.map(r => (
            <option key={r} value={r} className="bg-cherry-soda text-white">
              {r}
            </option>
          ))}
        </select>

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
            "Let's talk"
          )}
        </button>
      </div>
    </div>
  );
}
