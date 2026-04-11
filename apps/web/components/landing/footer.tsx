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
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:px-8">
        {/* Brand + navigation */}
        <div className="lg:flex lg:justify-between lg:gap-16">
          {/* Logo */}
          <div className="mb-10 lg:mb-0 lg:shrink-0">
            <div className="flex items-center">
              <Image src="/symbol2.png" alt="SODAX Symbol" width={32} height={32} />
              <span className="ml-2 font-black text-2xl text-cherry-bright">SODAX</span>
            </div>
          </div>

          {/* Navigation columns */}
          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 sm:flex sm:gap-12 lg:gap-16">
            {/* Products */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-cherry-bright text-base font-normal font-['Shrikhand'] leading-5">
                cross-network products
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <FooterLink href={EXCHANGE_ROUTE} className="text-sm font-semibold">
                  Exchange
                </FooterLink>
                <div className="flex flex-col gap-2 pl-3 border-l border-cherry-brighter/40">
                  <FooterLink href={SWAP_FOR_APPS_ROUTE} className="text-[12px] text-clay-dark">
                    Swaps for apps
                  </FooterLink>
                  <FooterLink href={LEAD_BORROW_FOR_APPS_ROUTE} className="text-[12px] text-clay-dark">
                    Lend / Borrow for apps
                  </FooterLink>
                  <FooterLink href={BRIDGE_SERVICES_ROUTE} className="text-[12px] text-clay-dark">
                    Bridge service
                  </FooterLink>
                </div>
                <FooterLink href={PARTNER_DASHBOARD_ROUTE}>Partner Portal</FooterLink>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-cherry-bright text-base font-normal font-['Shrikhand'] leading-5">social</h3>
              <div className="mt-4 flex flex-col gap-3">
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
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-cherry-bright text-base font-normal font-['Shrikhand'] leading-5">resources</h3>
              <div className="mt-4 flex flex-col gap-3">
                <FooterLink href={DOCUMENTATION_GITBOOK_ROUTE} showArrow>
                  Documentation
                </FooterLink>
                <FooterLink href={SODAX_SCAN_ROUTE} showArrow>
                  Transaction Scanner
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
                <FooterLink href={NEWS_ROUTE}>News</FooterLink>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-cherry-brighter/30 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-['InterMedium'] text-cherry-bright">
              © 2026 ICON Foundation. All rights reserved.
            </p>
            <div className="flex gap-4">
              <FooterLink href="#" onClick={handleTermsClick} className="text-xs text-cherry-bright">
                Terms
              </FooterLink>
              <FooterLink
                href="#"
                onClick={e => {
                  e.preventDefault();
                  showCookiePreferences();
                }}
                className="text-xs text-cherry-bright"
              >
                Cookie Settings
              </FooterLink>
            </div>
          </div>
        </div>
      </div>

      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </footer>
  );
};

export default Footer;
