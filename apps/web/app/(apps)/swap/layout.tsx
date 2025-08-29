// apps/web/app/(apps)/swap/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { SwapStoreProvider } from './_stores/swap-store-provider';

export default function SwapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
