import Image from 'next/image';
import Link from 'next/link';
import { Mail, Send } from 'lucide-react';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { DISCORD_ROUTE, DOCUMENTATION_ROUTE, HOME_ROUTE, X_ROUTE } from '@/constants/routes';
import type { ConnectEntry } from '@/lib/connect';

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

interface ContactLinkProps {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

function ContactLink({ href, label, value, icon }: ContactLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 w-full px-5 h-14 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 transition-colors border border-white/10"
    >
      <span className="flex items-center justify-center size-9 rounded-full bg-white/10 text-white shrink-0">
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-cherry-brighter text-xs font-[InterRegular] leading-tight">{label}</span>
        <span className="text-white text-sm font-[InterBold] truncate">{value}</span>
      </span>
    </Link>
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
          <Image src="/symbol.png" alt="SODAX" width={24} height={24} />
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
              <ContactLink
                href={`mailto:${entry.email}`}
                label="Email"
                value={entry.email}
                icon={<Mail className="size-4" />}
              />
            )}
            {entry.telegram && (
              <ContactLink
                href={entry.telegram}
                label="Telegram"
                value={displayUrl(entry.telegram)}
                icon={<Send className="size-4" />}
              />
            )}
            {entry.x && (
              <ContactLink href={entry.x} label="X" value={displayUrl(entry.x)} icon={<XIcon className="size-4" />} />
            )}
            {entry.linkedin && (
              <ContactLink
                href={entry.linkedin}
                label="LinkedIn"
                value={displayUrl(entry.linkedin)}
                icon={<LinkedInIcon className="size-4" />}
              />
            )}
          </div>
        )}

        {/* Tagline */}
        <div className="mt-auto pt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-cherry-brighter text-xs font-[InterRegular] uppercase tracking-wider">SODAX</p>
          <p className="text-white/80 text-sm font-[InterRegular] leading-relaxed max-w-xs">
            The cross-network execution layer for modern money.
          </p>
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
          <Image src="/symbol.png" alt="SODAX" width={14} height={14} className="opacity-40" />
          <span className="text-cherry-bright/40 text-xs font-[InterRegular]">© 2026 ICON Foundation</span>
        </div>
      </footer>
    </div>
  );
}
