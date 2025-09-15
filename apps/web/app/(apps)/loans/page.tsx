'use client';

import React from 'react';
import { useXAccounts } from '@sodax/wallet-sdk-react';

export default function LoansPage() {
  const xAccounts = useXAccounts();
  return (
    <div className="inline-flex flex-col justify-start items-start gap-4">
      <div>LoansPage {xAccounts['EVM']?.address}</div>
    </div>
  );
}
