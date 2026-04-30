import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Mail, Send } from 'lucide-react';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { DISCORD_ROUTE, DOCUMENTATION_ROUTE, HOME_ROUTE, X_ROUTE } from '@/constants/routes';
import type { ConnectEntry } from '@/lib/connect';
import { CopyButton } from './copy-button';

interface ConnectCardProps {
  entry: ConnectEntry;
  /** Stable proxy URL for the avatar (always fresh, never expires). */
  avatarProxyUrl: string;
}

function XIcon({ className }: { className?: string }) {
  // Lucide has no X (post-Twitter) glyph; inline the official mark.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface ContactRowProps {
  /** URL or mailto: — opens the native app / site on tap */
  href: string;
  label: string;
  /** What the user sees (shortened, no protocol) */
  displayValue: string;
  /** What goes to the clipboard — bare email or full URL (with protocol) */
  copyValue: string;
  icon: React.ReactNode;
}

/**
 * Two tap-targets per row: the pill link navigates to the platform (mailto,
 * tg, https…) and the round button copies the value. Conferences have patchy
 * wifi, so copy is the reliable path — the link is a best-effort shortcut.
 */
function ContactRow({ href, label, displayValue, copyValue, icon }: ContactRowProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 flex-1 min-w-0 pl-2 pr-5 h-14 rounded-full bg-white/[0.08] hover:bg-white/15 active:bg-white/20 transition-colors border border-white/20"
      >
        <span className="flex items-center justify-center size-10 rounded-full bg-white/15 text-white shrink-0">
          {icon}
        </span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-cherry-brighter text-xs font-[InterRegular] leading-tight">{label}</span>
          <span className="text-white text-sm font-[InterBold] truncate">{displayValue}</span>
        </span>
        <ArrowUpRight
          className="size-4 text-cherry-brighter shrink-0 group-hover:text-white transition-colors"
          aria-hidden="true"
        />
      </Link>
      <CopyButton value={copyValue} label={`Copy ${label.toLowerCase()}`} />
    </div>
  );
}

/**
 * Format a URL for display: strip protocol, www, and trailing slash.
 * e.g. https://t.me/real_digidavid → t.me/real_digidavid
 */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function ConnectCard({ entry, avatarProxyUrl }: ConnectCardProps) {
  const hasContact = Boolean(entry.email || entry.telegram || entry.x || entry.linkedin);

  return (
    <div className="min-h-dvh w-screen bg-cherry-soda text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-md mx-auto w-full">
        <Link href={HOME_ROUTE} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/soda-yellow.png" alt="SODAX" width={24} height={24} />
          <SodaxIcon width={64} height={14} fill="white" />
        </Link>
        <span className="text-cherry-brighter text-xs font-[InterRegular] uppercase tracking-wider">Connect</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 pt-4 pb-10 gap-8 max-w-md mx-auto w-full">
        {/* Identity */}
        <div className="flex flex-col items-center text-center gap-5 pt-4">
          {entry.avatarUrl ? (
            <Image
              src={avatarProxyUrl}
              alt={entry.name}
              width={128}
              height={128}
              unoptimized
              priority
              className="size-32 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="size-32 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
              <span className="text-4xl font-[InterBlack] text-white/60">{entry.name.slice(0, 1).toUpperCase()}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-[InterBlack] leading-tight">{entry.name}</h1>
            {entry.role && <p className="text-cherry-brighter text-sm font-[InterRegular]">{entry.role}</p>}
          </div>
        </div>

        {/* Contact links */}
        {hasContact && (
          <div className="flex flex-col gap-3 w-full">
            {entry.email && (
              <ContactRow
                href={`mailto:${entry.email}`}
                label="Email"
                displayValue={entry.email}
                copyValue={entry.email}
                icon={<Mail className="size-4" />}
              />
            )}
            {entry.telegram && (
              <ContactRow
                href={entry.telegram}
                label="Telegram"
                displayValue={displayUrl(entry.telegram)}
                copyValue={entry.telegram}
                icon={<Send className="size-4" />}
              />
            )}
            {entry.x && (
              <ContactRow
                href={entry.x}
                label="X"
                displayValue={displayUrl(entry.x)}
                copyValue={entry.x}
                icon={<XIcon className="size-4" />}
              />
            )}
            {entry.linkedin && (
              <ContactRow
                href={entry.linkedin}
                label="LinkedIn"
                displayValue={displayUrl(entry.linkedin)}
                copyValue={entry.linkedin}
                icon={<LinkedInIcon className="size-4" />}
              />
            )}
          </div>
        )}

        {/* Hero-style signature — mirrors the sodax.com homepage treatment */}
        <div className="mt-auto pt-10 flex items-center justify-center gap-3 sm:gap-4">
          <Image
            src="/landing/brace-left.svg"
            alt=""
            width={20}
            height={64}
            className="-scale-x-100 h-14 w-auto opacity-90"
          />
          <div className="flex flex-col items-center text-center text-xl leading-[1.1] whitespace-nowrap">
            <span className="mix-blend-hard-light text-white font-[InterBlack]">Infrastructure for</span>
            <span className="mix-blend-hard-light text-yellow-soda font-[Shrikhand] italic">modern money</span>
          </div>
          <Image src="/landing/brace-right.svg" alt="" width={20} height={64} className="h-14 w-auto opacity-90" />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 flex flex-col items-center gap-4 max-w-md mx-auto w-full">
        <div className="flex items-center gap-5 text-cherry-brighter text-xs font-[InterRegular]">
          <Link href={HOME_ROUTE} className="hover:text-white transition-colors">
            sodax.com
          </Link>
          <Link
            href={DOCUMENTATION_ROUTE}
            className="hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </Link>
          <Link href={X_ROUTE} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            X
          </Link>
          <Link
            href={DISCORD_ROUTE}
            className="hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/soda-yellow-sm.png" alt="SODAX" width={14} height={14} className="opacity-40" />
          <span className="text-cherry-bright/40 text-xs font-[InterRegular]">© 2026 SODAX</span>
        </div>
      </footer>
    </div>
  );
}
