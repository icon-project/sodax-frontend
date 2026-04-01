import { DOCUMENTATION_ROUTE } from '@/constants/routes';

// Helper function to convert network name to documentation anchor
export const getNetworkDocsUrl = (networkName: string): string => {
  const anchorMap: Record<string, string> = {
    'BNB Chain': 'bsc',
    HyperEVM: 'hyperevm',
    LightLink: 'lightlink',
  };
  const anchor = anchorMap[networkName] || networkName.toLowerCase();
  return `${DOCUMENTATION_ROUTE}/developers/deployments/solver-compatible-assets#${anchor}`;
};
