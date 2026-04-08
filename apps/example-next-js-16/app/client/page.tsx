'use client';

import { useEffect, useState } from 'react';
import { encodeAddress } from '@sodax/sdk';

// Client component — exercises the Turbopack browser bundle of @sodax/sdk.
// The SSR test in app/page.tsx covers the server bundle; this covers the
// client bundle, which Turbopack produces separately and could in theory
// have a different scope-hoisting outcome. See issue #1070.
export default function ClientPage() {
  const [encoded, setEncoded] = useState<string>('loading...');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      try {
        const r = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
        setEncoded(r);
        setAttempts(n);
        clearInterval(id);
      } catch (e) {
        n++;
        setAttempts(n);
        if (n > 50) {
          setEncoded(`FAILED: ${String(e)}`);
          clearInterval(id);
        }
      }
    }, 10);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>sodax next16 — client bundle stacks lazy path test</h1>
      <p data-testid="encoded">encoded: {encoded}</p>
      <p>retries: {attempts}</p>
      <p>
        Open browser devtools console — if Turbopack client bundle has the cycle bug, you will see
        <code> Module XXX was instantiated... </code> here.
      </p>
    </main>
  );
}
