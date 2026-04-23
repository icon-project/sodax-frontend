import { useMemo } from 'react';
import { StacksXConnector } from './StacksXConnector.js';
import { STACKS_PROVIDERS } from './constants.js';

export function useStacksXConnectors(): StacksXConnector[] {
  return useMemo(() => STACKS_PROVIDERS.map(config => new StacksXConnector(config)), []);
}
