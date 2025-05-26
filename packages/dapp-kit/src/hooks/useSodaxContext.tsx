import { SodaxContext, type SodaxContextType } from '@/contexts';
import { useContext } from 'react';

export const useSodaxContext = (): SodaxContextType => {
  const context = useContext(SodaxContext);
  if (!context) {
    throw new Error('useSodax must be used within a SodaxProvider');
  }
  return context;
};
