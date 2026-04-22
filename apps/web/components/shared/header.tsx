import type React from 'react';
import { Navbar } from '@/components/shared/navbar';

export function Header(): React.JSX.Element {
  return (
    <div className="h-60 relative inline-flex flex-col justify-start items-center gap-2 w-full">
      <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
      <Navbar />
    </div>
  );
}
