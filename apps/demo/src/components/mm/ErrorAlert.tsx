// apps/demo/src/components/mm/ErrorAlert.tsx
// Displays error text in a consistent, well-aligned alert box inside money market modals.
// Supports dark mode and provides consistent error styling across all money market actions.

import React, { type ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  text: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export function ErrorAlert({ text, className, variant = 'default' }: ErrorAlertProps): ReactElement {
  const isCompact = variant === 'compact';
  
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-left',
        isCompact ? 'px-2 py-1.5' : 'px-4 py-3',
        className,
      )}
      role="alert"
    >
      <p
        className={cn(
          'overflow-y-auto whitespace-pre-wrap break-words text-red-700 dark:text-red-400',
          isCompact ? 'text-xs' : 'max-h-32 font-mono text-sm',
        )}
      >
        {text}
      </p>
    </div>
  );
}
