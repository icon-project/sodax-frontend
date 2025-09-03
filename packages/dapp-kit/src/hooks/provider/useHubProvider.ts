import type { EvmHubProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useHubProvider(): EvmHubProvider {
  const { sodax } = useSodaxContext();

  return sodax.hubProvider;
}
