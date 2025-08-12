import type { ReactNode } from 'react';
import ClientShell from './_client-shell';
import '../globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
