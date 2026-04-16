'use client';

import { FooterLink } from '@/components/landing/footer-link';
import TermsModal from '@/components/landing/terms-modal';
import { showCookiePreferences } from '@/components/cookie-consent/cookie-consent-banner';
import {
  BRAND_KIT_ROUTE,
  BRIDGE_SERVICES_ROUTE,
  DISCORD_ROUTE,
  DOCUMENTATION_GITBOOK_ROUTE,
  EXCHANGE_ROUTE,
  GITHUB_ROUTE,
  LEAD_BORROW_FOR_APPS_ROUTE,
  LINKEDIN_ROUTE,
  NEWS_ROUTE,
  PARTNER_DASHBOARD_ROUTE,
  SODAX_SCAN_ROUTE,
  SWAP_FOR_APPS_ROUTE,
  X_ROUTE,
} from '@/constants/routes';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface FooterProps {
  onTermsClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onTermsClick }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleTermsClick = () => {
    setIsTermsModalOpen(true);
    onTermsClick?.();
  };

  return (
    <footer className="bg-almost-white">
      <div className="mx-auto max-w-[944px] px-6 pt-20 pb-20 sm:px-8 sm:pt-[120px] sm:pb-[120px]">
        {/* Logo + Navigation columns */}
        <div className="flex flex-wrap items-start justify-between gap-y-10">
          {/* Logo */}
          <div className="shrink-0">
            <div className="flex items-center">
              <Image src="/soda-cherry.png" alt="SODAX Symbol" width={32} height={32} className="sm:hidden" />
              <Image
                src="/soda-cherry-grey.svg"
                alt="SODAX Symbol"
                width={30}
                height={32}
                className="hidden sm:block"
              />
              <span className="ml-2 font-black text-2xl text-cherry-bright sm:text-cherry-grey">SODAX</span>
            </div>
          </div>

          {/* Navigation columns */}
          <nav className="flex flex-wrap gap-10">
            {/* Cross-network products */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[9px] font-bold uppercase leading-[1.2] text-clay-light">Cross-network products</h3>
              <div className="flex flex-col gap-2">
                {/* B2B filled bubbles */}
                <a
                  href={SWAP_FOR_APPS_ROUTE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-6 w-fit items-center rounded-full bg-cream-white px-3 pt-0.5 text-xs text-espresso leading-[1.4] hover:bg-cherry-grey transition-colors"
                >
                  Intent swaps for apps
                </a>
                <a
                  href={LEAD_BORROW_FOR_APPS_ROUTE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-6 w-fit items-center rounded-full bg-cream-white px-3 pt-0.5 text-xs text-espresso leading-[1.4] hover:bg-cherry-grey transition-colors"
                >
                  Lend / Borrow for apps
                </a>
                <a
                  href={BRIDGE_SERVICES_ROUTE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-6 w-fit items-center rounded-full bg-cream-white px-3 pt-0.5 text-xs text-espresso leading-[1.4] hover:bg-cherry-grey transition-colors"
                >
                  Bridge service
                </a>
                {/* B2C outline bubble */}
                <Link
                  href={EXCHANGE_ROUTE}
                  className="flex h-6 w-fit items-center rounded-full border-2 border-cream-white px-3 pt-0.5 text-xs text-clay leading-[1.4] hover:border-cherry-grey transition-colors"
                >
                  SODA Exchange
                </Link>
              </div>
            </div>

            {/* Socials */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[9px] font-bold uppercase leading-[1.2] text-clay-light">Socials</h3>
              <FooterLink href={X_ROUTE} showArrow>
                X (Twitter)
              </FooterLink>
              <FooterLink href={DISCORD_ROUTE} showArrow>
                Discord
              </FooterLink>
              <FooterLink href={LINKEDIN_ROUTE} showArrow>
                LinkedIn
              </FooterLink>
              <FooterLink href={GITHUB_ROUTE} showArrow>
                GitHub
              </FooterLink>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[9px] font-bold uppercase leading-[1.2] text-clay-light">Resources</h3>
              <FooterLink href={DOCUMENTATION_GITBOOK_ROUTE} showArrow>
                Documentation
              </FooterLink>
              <FooterLink href={SODAX_SCAN_ROUTE} showArrow>
                Transaction scanner
              </FooterLink>
              <FooterLink
                href={BRAND_KIT_ROUTE}
                showArrowDown
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = BRAND_KIT_ROUTE;
                  link.download = 'SODAX.logos.and.token.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Brand Kit
              </FooterLink>
              <FooterLink href={PARTNER_DASHBOARD_ROUTE}>Partner portal</FooterLink>
            </div>
          </nav>
        </div>

        {/* Divider */}
        <div className="mt-6 border-t border-clay-light/30" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-clay-light leading-[1.4]">&copy; 2026 ICON Foundation. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <FooterLink href={NEWS_ROUTE} className="text-clay-light hover:text-espresso">
              News
            </FooterLink>
            <button
              type="button"
              onClick={handleTermsClick}
              className="inline-flex items-center text-xs text-clay-light leading-[1.4] hover:text-espresso transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                showCookiePreferences();
              }}
              className="inline-flex items-center text-xs text-clay-light leading-[1.4] hover:text-espresso transition-colors cursor-pointer"
            >
              Cookie settings
            </button>
          </div>
        </div>
      </div>

      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </footer>
  );
};

export default Footer;
