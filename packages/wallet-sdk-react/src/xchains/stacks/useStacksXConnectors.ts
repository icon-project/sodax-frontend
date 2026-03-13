import { useMemo } from 'react';
import { StacksXConnector } from './StacksXConnector';

export function useStacksXConnectors(): StacksXConnector[] {
  return useMemo(() => [new StacksXConnector()], []);
}
