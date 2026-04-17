'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CopyButtonProps {
  /** Raw string to copy (email, URL, handle, etc.) */
  value: string;
  /** Accessible label, e.g. "Copy email" */
  label: string;
}

/**
 * Small copy-to-clipboard button for connect card rows. Sits next to a sibling
 * <Link>; we stop propagation to prevent bubbling through the row.
 *
 * Intended for use at conferences where wifi is spotty and opening a link may
 * fail — the copied value always works offline.
 */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for insecure contexts / older browsers. execCommand
          // returns a boolean and can fail silently — surface the failure
          // so the catch block keeps the UI honest.
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (!ok) throw new Error('execCommand copy returned false');
        }

        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('[connect] Clipboard copy failed:', error);
      }
    },
    [value],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      aria-live="polite"
      className="flex items-center justify-center size-9 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/20 text-white shrink-0 transition-colors"
    >
      {copied ? (
        <Check className="size-4 text-yellow-soda" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      <span className="sr-only">{copied ? 'Copied to clipboard' : label}</span>
    </button>
  );
}
