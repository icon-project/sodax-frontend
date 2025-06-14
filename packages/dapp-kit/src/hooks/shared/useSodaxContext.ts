import { SodaxContext, type SodaxContextType } from '@/contexts';
import { useContext } from 'react';

/**
 * Hook to access the Sodax context which provides access to the Sodax SDK instance and chain configuration
 * @throws {Error} If used outside of a SodaxProvider
 * @returns {SodaxContextType} The Sodax context containing SDK instance and configuration
 */

export const useSodaxContext = (): SodaxContextType => {
  const context = useContext(SodaxContext);
  if (!context) {
    throw new Error('useSodaxContext must be used within a SodaxProvider');
  }
  return context;
};
