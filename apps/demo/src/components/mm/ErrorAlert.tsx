// Displays error text in a consistent, well-aligned alert box inside money market modals.

import React, { type ReactElement } from 'react';
import { AlertCircle } from 'lucide-react';
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
        'flex w-full items-start gap-2 rounded-lg border border-negative bg-negative/10 text-left text-negative',
        isCompact ? 'px-2.5 py-2' : 'px-3.5 py-3',
        className,
      )}
      role="alert"
    >
      <AlertCircle className={cn('shrink-0', isCompact ? 'size-3.5' : 'size-4')} />
      <p
        className={cn(
          'overflow-y-auto whitespace-pre-wrap wrap-break-word font-medium',
          isCompact ? 'text-xs' : 'max-h-32 text-body-small',
        )}
      >
        {text}
      </p>
    </div>
  );
}
