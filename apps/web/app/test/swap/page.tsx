'use client';

import { useXAccounts } from '@sodax/wallet-sdk-react';

export default function SwapTestPage() {
  const xAccounts = useXAccounts();
  console.log('xAccounts', xAccounts['EVM']);
  return <div>SwapTestPage {xAccounts['EVM']?.address}</div>;
}
