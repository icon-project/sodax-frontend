// apps/web/hooks/useIsHanaInstalled.ts
// Hook to detect if Hana wallet browser extension is installed

import { useCallback, useEffect, useState } from 'react';

type HanaWallet = {
  available?: boolean;
  version?: string;
};

/**
 * Custom hook to check if Hana wallet is installed in the browser.
 * Re-checks on mount and can be triggered to re-check via the returned function.
 *
 * @returns Object with `isInstalled` (null = unknown, true/false = checked) and `recheck` function
 */
export function useIsHanaInstalled(): boolean | null {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  const checkHanaInstalled = useCallback((): void => {
    if (typeof window !== 'undefined') {
      const hanaWallet = (window as { hanaWallet?: HanaWallet }).hanaWallet;
      setIsInstalled(!!hanaWallet?.available);
    }
  }, []);

  useEffect(() => {
    checkHanaInstalled();
  }, [checkHanaInstalled]);

  return isInstalled;
}
