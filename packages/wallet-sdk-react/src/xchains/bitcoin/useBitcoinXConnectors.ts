import { useMemo } from 'react';
import type { BitcoinXConnector } from './BitcoinXConnector.js';
import { useXService } from '../../hooks/index.js';

/**
 * Hook to return available Bitcoin wallet connectors from the globally registered xService.
 */
export function useBitcoinXConnectors(): BitcoinXConnector[] {
  const xService = useXService('BITCOIN');
  
  return useMemo(() => {
    return (xService?.getXConnectors() || []) as BitcoinXConnector[];
  }, [xService]);
}
