'use client';

import { useCallback, useState } from 'react';

export function useWalletConnection() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(v => !v), []);

  return {
    isSidebarOpen,

    toggleSidebar,
  };
}
