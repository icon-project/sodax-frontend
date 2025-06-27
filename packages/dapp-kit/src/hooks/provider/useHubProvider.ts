import type { EvmHubProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useHubProvider(): EvmHubProvider | undefined {
  const { hubProvider } = useSodaxContext();

  return hubProvider;
}
