// apps/web/components/ui/tab-config.ts
import type { TabIconType } from './tab-icon';

export interface TabConfig {
  value: string;
  type: TabIconType;
  label: string;
  content: string;
}

export const tabConfigs: TabConfig[] = [
  {
    value: 'portfolio',
    type: 'portfolio',
    label: 'Portfolio',
    content: 'a quick portfolio',
  },
  {
    value: 'savings',
    type: 'savings',
    label: 'savings',
    content: 'a quick savings',
  },
  {
    value: 'loans',
    type: 'loans',
    label: 'Loans',
    content: 'a quick loans',
  },
  {
    value: 'migrate',
    type: 'migrate',
    label: 'Migrate',
    content: 'a quick migrate',
  },
];
