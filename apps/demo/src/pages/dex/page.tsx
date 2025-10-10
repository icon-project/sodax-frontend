// apps/demo/src/pages/dex/page.tsx
import React from 'react';
import { SimplePoolManager } from '@/components/dex/SimplePoolManager';

export default function DexPage(): JSX.Element {
  return (
    <main className="container mx-auto p-4 mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DEX Demo - Concentrated Liquidity</h1>
          <p className="text-muted-foreground mt-2">Simple SDK-based pool management</p>
        </div>
      </div>

      <SimplePoolManager />
    </main>
  );
}
