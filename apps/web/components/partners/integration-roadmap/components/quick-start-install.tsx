// Copyable install command block for the roadmap Quick start section.

'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUICK_START_INSTALL } from '../data/constants';

export function QuickStartInstall(): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(QUICK_START_INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-white rounded-3xl flex flex-col gap-3 p-6 md:p-8 border border-cherry-grey/20">
      <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Quick start</h2>
      <p className="font-normal text-[14px] leading-normal text-clay-dark">
        Install the SDK packages, then follow the docs for your integration category.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <code className="flex-1 min-w-0 rounded-lg bg-espresso/5 border border-cherry-grey/20 px-3 py-2 font-mono text-[12px] sm:text-[13px] text-espresso break-all">
          {QUICK_START_INSTALL}
        </code>
        <Button
          type="button"
          variant="cherry"
          size="default"
          onClick={handleCopy}
          className="shrink-0 h-9 px-4 rounded-lg text-[13px]"
          aria-label="Copy install command"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
