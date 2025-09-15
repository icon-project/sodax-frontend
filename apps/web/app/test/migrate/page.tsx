'use client';

import { useXAccounts } from '@sodax/wallet-sdk-react';
export default function MigrateTestPage() {
  const xAccounts = useXAccounts();
  console.log('xAccounts', xAccounts['EVM']);
  return <div>MigrateTestPage {xAccounts['EVM']?.address}</div>;
}
