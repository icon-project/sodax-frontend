import { useMemo } from 'react';
import { BitcoinXConnector } from './BitcoinXConnector.js';
import { useXService } from '../../hooks/index.js';

/**
 * Hook to return available Bitcoin wallet connectors from the globally registered xService.
 */
export function useBitcoinXConnectors(): BitcoinXConnector[] {
  const xService = useXService('BITCOIN');

  return useMemo(() => {
    const connectors = xService?.getXConnectors() ?? [];
    return connectors.filter((c): c is BitcoinXConnector => c instanceof BitcoinXConnector);
  }, [xService]);
}
