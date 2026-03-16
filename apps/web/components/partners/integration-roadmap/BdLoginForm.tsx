// Client component: BD passcode form. On success refreshes so the page re-renders with auth.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function BdLoginForm(): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setError(false);
    const res = await fetch('/api/bd-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm px-6">
      <div className="flex items-center gap-2 mb-2">
        <Image src="/symbol_dark.png" alt="SODAX" width={28} height={28} />
        <span className="font-bold text-espresso">BD Access</span>
      </div>
      <p className="text-sm text-clay">Enter the BD passcode to continue.</p>
      <input
        type="password"
        placeholder="Passcode"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="h-11 px-4 rounded-2xl border-2 border-cherry-grey bg-white text-espresso focus:outline-none focus:border-cherry-soda"
      />
      {error && <p className="text-sm text-red-500">Incorrect passcode.</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!password.trim() || loading}
        className="bg-yellow-soda text-espresso font-bold h-11 rounded-full disabled:opacity-40"
      >
        {loading ? 'Checking...' : 'Enter'}
      </button>
    </div>
  );
}
