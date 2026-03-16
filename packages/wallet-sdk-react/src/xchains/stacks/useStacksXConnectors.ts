import { useMemo } from 'react';
import { StacksXConnector } from './StacksXConnector';
import { STACKS_PROVIDERS } from './constants';

export function useStacksXConnectors(): StacksXConnector[] {
  return useMemo(() => STACKS_PROVIDERS.map(config => new StacksXConnector(config)), []);
}
