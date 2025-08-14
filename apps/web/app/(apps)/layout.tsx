import type { ReactNode } from 'react';
import AppTemplate from './_app-template';
import '../globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <AppTemplate>{children}</AppTemplate>;
}
