// Displays error text in a consistent, well-aligned alert box inside money market modals.
// Supports dark mode and provides consistent error styling across all money market actions.

import React, { type ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  text: string;
  className?: string;
}

export function ErrorAlert({ text, className }: ErrorAlertProps): ReactElement {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-left',
        className,
      )}
      role="alert"
    >
      <p className="max-h-32 overflow-y-auto whitespace-pre-wrap wrap-break-word font-mono text-sm text-red-700 dark:text-red-400">
        {text}
      </p>
    </div>
  );
}
