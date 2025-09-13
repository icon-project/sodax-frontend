'use client';

import React from 'react';
import { useXAccounts } from '@sodax/wallet-sdk-react';

export default function SavingsPage() {
  const xAccounts = useXAccounts();
  return (
    <div className="inline-flex flex-col justify-start items-start gap-4">
      <div>SavingsPage {xAccounts['EVM']?.address}</div>
    </div>
  );
}
