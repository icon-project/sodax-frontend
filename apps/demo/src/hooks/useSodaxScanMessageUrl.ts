// Fetches SodaxScan message URL for a given source tx hash for use in success modals.

import { useEffect, useState } from 'react';
import { getSodaxScanMessageUrl } from '@/lib/sodaxScan';

export interface UseSodaxScanMessageUrlResult {
  url: string | null;
  isLoading: boolean;
}

/**
 * Resolves a transaction hash to a SodaxScan message URL.
 * Used by money market success modals to link to "View on SodaxScan" instead of chain explorer. If not available, fallback to explorerUrl
 */
export function useSodaxScanMessageUrl(txHash: string | undefined): UseSodaxScanMessageUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!txHash) {
      setUrl(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const fetchUrl = async (): Promise<void> => {
      try {
        const resolved = await getSodaxScanMessageUrl(txHash);
        if (cancelled) return;
        if (resolved) {
          setUrl(resolved);
          setIsLoading(false);
        } else if (retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(fetchUrl, retryDelay);
        } else {
          setUrl(null);
          setIsLoading(false);
        }
      } catch {
        if (cancelled) return;
        setUrl(null);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setUrl(null);
    fetchUrl();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [txHash]);

  return { url, isLoading };
}
