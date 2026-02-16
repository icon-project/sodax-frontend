// Displays raw error text in a consistent, well-aligned box inside MM modals.

import React, { type ReactElement } from 'react';

interface MmErrorBoxProps {
  text: string;
}

export function MmErrorBox({ text }: MmErrorBoxProps): ReactElement {
  return (
    <div className="mt-2 w-full rounded-lg border border-red-200 bg-red-50/90 px-3 py-2.5 text-left" role="alert">
      <p className="max-h-32 overflow-y-auto whitespace-pre-wrap wrap-break-word font-mono text-sm text-red-800">
        {text}
      </p>
    </div>
  );
}
