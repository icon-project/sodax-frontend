import Image from 'next/image';
import { PartnerPageLayout, generatePartnerMetadata } from '@/components/partners/partner-page-layout';
import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { PageActions } from '@/components/partners/page-actions';
import {
  AnimatedSection,
  AnimatedScrollSection,
  AnimatedStaggerContainer,
  AnimatedStaggerChild,
  AnimatedFadeIn,
} from '@/components/partners/animated-section';

// Local asset paths
const imgLogo = '/partners/hana/logo.svg';
const imgLogoSmall = '/partners/hana/logo.svg';
const img = '/partners/sodax-symbol.svg';
const pdfDeck = '/partners/hana/SODAX - Hana.pdf';

const partnerMetadata = {
  partnerName: 'Hana',
  tagline: 'Multi-Network Wallet & Payments App',
  description:
    'How Hana Wallet integrated SODAX SDK to enable cross-network trades in ~22 seconds across 14+ networks. Users can now trade and spend crypto without ever thinking about bridges or networks.',
  logoUrl: imgLogo,
};

export const metadata: Metadata = generatePartnerMetadata(partnerMetadata);

export default function HanaPage() {
  return (
    <PartnerPageLayout metadata={partnerMetadata}>
      {/* Title */}
      <AnimatedSection className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 w-full">
        <div className="flex gap-3 md:gap-4 items-center">
          <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
            <Image alt="Hana Logo" className="object-contain" src={imgLogo} width={80} height={80} />
          </div>
          <div className="flex flex-col items-start justify-center">
            <p className="font-['InterMedium'] text-xs md:text-sm text-[var(--clay-light)] uppercase leading-tight tracking-wider">
              CASE STUDY: SDK INTEGRATION
            </p>
            <p className="font-['InterBold'] text-2xl md:text-3xl lg:text-4xl text-[var(--espresso)] leading-tight">
              Hana
            </p>
            <p className="font-['InterBold'] text-sm md:text-base lg:text-lg text-[var(--clay)] leading-normal">
              Multi-Network Wallet & Payments App
            </p>
          </div>
        </div>
        <PageActions
          pdfUrl={pdfDeck}
          pdfTitle="SODAX - Hana Case Study"
          shareTitle="Hana Case Study | SODAX Partners"
        />
      </AnimatedSection>

      {/* Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Main Content */}
        <AnimatedStaggerContainer className="flex-1 flex flex-col gap-6 items-start min-w-0 w-full lg:w-auto">
          {/* Subtitle Box */}
          <AnimatedFadeIn className="flex flex-col items-start w-full">
            <div className="bg-[var(--almost-white)] flex items-center px-3 py-4 md:px-4 md:py-6 rounded-lg w-full relative">
              <p className="flex-1 font-['InterRegular'] text-sm md:text-base text-[var(--espresso)] leading-relaxed">
                For non-custodial wallets that want to add cross-network trades and real-world spending without managing
                bridges, liquidity, or custom integrations.
              </p>
            </div>
            <div className="flex justify-start w-full -mt-[1px]">
              <svg
                width="80"
                height="8"
                viewBox="0 0 80 8"
                fill="none"
                className="ml-4"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M40 8C39.0625 8 38.5871 7.52943 38.3333 7.05882C35.8368 2.42816 29.0165 1.56476e-06 20 2.0664e-06L60 -1.59051e-07C50.9835 3.42592e-07 44.1632 2.42816 41.6667 7.05882C41.4129 7.52943 40.9375 8 40 8Z"
                  fill="var(--almost-white)"
                />
              </svg>
            </div>
          </AnimatedFadeIn>

          {/* The Partner */}
          <AnimatedStaggerChild className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start leading-normal">
              <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full">The Partner</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full">
                Hana Wallet is a non-custodial, multi-network crypto wallet and payments app designed to make everyday
                crypto use simple. It gives users full control of their assets across 14+ networks, enables
                cross-network trades in seconds, and allows users to spend crypto directly through a Web3 debit
                Mastercard. Hana's mission is to turn crypto into something usable in real life, not just inside Web3.
              </p>
            </div>
          </AnimatedStaggerChild>

          {/* The Challenge */}
          <AnimatedStaggerChild className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start">
              <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Challenge</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Wallet users face a fundamental fragmentation problem. Many need multiple wallets for different
                ecosystems (EVM, Sui, Solana, etc.), separate apps for DeFi, and still lack a native way to spend crypto
                without cashing out through centralized exchanges.
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                For wallets trying to add cross-network trades, the barriers are structural:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start w-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Cross-network trades require managing bridges, liquidity, and complex edge cases
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Scaling to new networks and assets demands custom engineering work
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Existing bridge solutions are slow, risky, and confusing for users
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Users experience friction at every step: bridge → wait → trade → convert to fiat to spend
                  </p>
                </div>
              </div>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                Hana wanted to unify asset management, DeFi access, and real-world spending in one app. Without a simple
                cross-network infrastructure layer, adding trades would have required months of custom bridge management
                and liquidity provisioning.
              </p>
            </div>
          </AnimatedStaggerChild>

          {/* The Solution */}
          <AnimatedStaggerChild className="flex flex-col gap-2 items-start w-full">
            <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Solution</p>
            <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
              SODAX's SDK removed cross-network complexity. Hana gained three core capabilities:
            </p>
            <div className="flex flex-col gap-2 items-start w-full">
              {/* Bullet 1 */}
              <div className="flex gap-2 items-start py-4 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">1</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Instant Cross-Chain Trades
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    <span className="font-['InterMedium']">Previously:</span> Users had to navigate bridges manually,
                    wait for confirmations, manage wrapped tokens, and deal with slippage.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Now:</span> Users specify intent ("I want SOL on Solana"),
                    and SODAX's solver handles routing and settlement. Trades settle in ~22 seconds, without manual
                    bridging steps or user-side complexity.
                  </p>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex gap-2 items-start py-4 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">2</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Unified Liquidity Layer
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    <span className="font-['InterMedium']">Previously:</span> Scaling to new networks meant Hana had to
                    understand, fund, and manage multiple bridge infrastructures and liquidity pools.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Now:</span> Hana taps SODAX's protocol-owned liquidity.
                    Assets become available across 14+ supported networks without Hana managing per-network liquidity
                    pools.
                  </p>
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex gap-2 items-start py-4 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">3</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Native Multi-Network Asset Support
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    <span className="font-['InterMedium']">Previously:</span> Adding new networks or assets required
                    custom development and backend integration work.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Now:</span> SODAX's intent-based infrastructure handles
                    routing and settlement. Hana can support new networks and assets without additional backend
                    engineering.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedStaggerChild>
        </AnimatedStaggerContainer>

        {/* Side panel */}
        <AnimatedScrollSection className="bg-[var(--almost-white)] flex flex-col gap-2 items-start px-4 py-6 rounded-lg shrink-0 w-full lg:w-[280px]">
          <div className="flex-1 flex flex-col gap-4 items-start w-full">
            {/* At a glance */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">
                At a glance
              </p>
              <ul className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full list-disc ml-4 space-y-1">
                <li>
                  <span className="font-['InterBold']">~22 second</span> trade execution*
                </li>
                <li>
                  <span className="font-['InterBold']">14+</span> networks accessible
                </li>
                <li>
                  <span className="font-['InterBold']">Any-network</span> yield deposits
                </li>
                <li>
                  <span className="font-['InterBold']">Any-asset</span> card top-ups
                </li>
              </ul>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* About Hana */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">About Hana</p>
              <div className="flex flex-col gap-1 items-start w-full">
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">47,000+</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">Installed users</p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">Web3 Mastercard</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">
                    Real-world spending capability
                  </p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">Key Partnerships</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">
                    Mastercard, Moneygram and Stellar Foundation
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* Quote */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">Quote</p>
              <p className="font-['InterRegular'] text-base text-[var(--clay-light)] w-full leading-relaxed">
                "SODAX turned what used to be a complicated, multi-step journey into one streamlined action. Our users
                can now trade and spend their crypto without ever thinking about bridges or networks."
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full text-right">
                <span className="font-['InterBold'] text-[var(--espresso)]">— Hana Wallet Team</span>
              </p>
            </div>
          </div>

          {/* References */}
          <div className="flex flex-col gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
            <p className="font-['InterRegular'] text-sm text-[var(--clay)] leading-normal">References</p>
            <div className="flex gap-2 items-center">
              <a
                href="https://www.hana.money/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 px-3 py-1.5 min-w-[110px] bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors"
              >
                <Globe size={14} className="text-[var(--espresso)]" />
                <span className="font-['InterMedium'] text-sm text-[var(--espresso)]">Website</span>
              </a>
              <a
                href="https://twitter.com/hanawallet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center h-9 justify-center gap-1.5 px-3 py-1.5 min-w-[110px] bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[var(--espresso)]"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-['InterMedium'] text-sm text-[var(--espresso)]">X</span>
              </a>
            </div>
          </div>
        </AnimatedScrollSection>
      </div>

      {/* Bottom Section */}
      <AnimatedStaggerContainer className="bg-[var(--almost-white)] flex flex-col lg:flex-row gap-6 md:gap-4 items-start p-3 md:p-6 lg:p-8 w-full rounded-lg">
        {/* Hana Results */}
        <AnimatedFadeIn className="flex-1 flex flex-col gap-2 items-start min-w-0 w-full lg:w-auto">
          <div className="flex gap-1 items-center w-full">
            <div className="relative shrink-0 w-4 h-4">
              <Image alt="Logo" className="object-contain" src={imgLogoSmall} width={16} height={16} />
            </div>
            <p className="font-['InterBold'] text-base md:text-lg text-[var(--espresso)] leading-normal">
              Hana Results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-2 items-start pb-2 w-full">
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                A Complete Money App
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Hana is no longer just a wallet. It operates as a consumer-facing money app where users hold their keys,
                move value across networks, and spend directly via Mastercard in supported regions, all from a single
                interface.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Real-World Use Cases Enabled
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                A freelancer gets paid in USDC on one network, trades into a stable asset on another network, and spends
                via the Hana card. Cross-border transfers route into the recipient's preferred network without bridge
                friction or exchange conversion.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Cross-Network Spending & Transfers
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                The integration enabled Hana to launch cross-network trades with ~22 second execution, reducing bridge
                delays and user confusion. Users can move and spend crypto without manually managing networks or bridge
                flows.
              </p>
            </div>
          </div>
        </AnimatedFadeIn>

        {/* SODAX Integration & Get started */}
        <AnimatedStaggerChild className="flex flex-col items-start justify-start gap-6 shrink-0 w-full lg:w-auto">
          {/* SODAX Integration */}
          <div className="flex flex-col gap-2 items-start rounded-lg shrink-0 w-full lg:w-[280px]">
            <div className="flex gap-1 items-center w-full">
              <div className="relative shrink-0 w-4 h-4">
                <Image
                  alt="SODAX symbol"
                  className="object-contain mix-blend-multiply"
                  src={img}
                  width={16}
                  height={16}
                />
              </div>
              <p className="flex-1 font-['InterBold'] text-sm text-[var(--espresso)] leading-normal min-w-0">
                SODAX Integration
              </p>
            </div>
            <div className="flex flex-col items-start w-full">
              <div className="flex flex-col gap-3 items-start w-full">
                <div className="flex justify-start w-full mb-[-12px]">
                  <svg
                    width="80"
                    height="8"
                    viewBox="0 0 80 8"
                    fill="none"
                    className="ml-2 rotate-180"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M40 8C39.0625 8 38.5871 7.52943 38.3333 7.05882C35.8368 2.42816 29.0165 1.56476e-06 20 2.0664e-06L60 -1.59051e-07C50.9835 3.42592e-07 44.1632 2.42816 41.6667 7.05882C41.4129 7.52943 40.9375 8 40 8Z"
                      fill="var(--cream-white)"
                    />
                  </svg>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[280px]">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-normal">
                    Foundation Layer
                  </p>
                  <div className="flex flex-col items-start text-xs w-full leading-tight">
                    <a
                      href="https://docs.sodax.com/developers/packages/sdk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline"
                    >
                      @SODAX/SDK
                    </a>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      This is the core logic that powers the entire ecosystem. It provides the raw functional modules
                      required to build with SODAX programmatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Get started */}
          <div className="flex flex-col gap-2 items-start w-full lg:w-auto border-t border-[var(--cream-white)] pt-4 lg:border-0 lg:pt-0">
            <div className="flex gap-1 items-center w-full">
              <div className="relative shrink-0 w-4 h-4">
                <Image
                  alt="SODAX symbol"
                  className="object-contain mix-blend-multiply"
                  src={img}
                  width={16}
                  height={16}
                />
              </div>
              <p className="flex-1 font-['InterBold'] text-sm text-[var(--espresso)] leading-normal min-w-0">
                Get started
              </p>
            </div>
            <div className="flex flex-col gap-2 items-start shrink-0 w-full lg:w-[280px]">
              <p className="font-['InterRegular'] text-sm text-[var(--clay)] leading-tight">
                <span className="font-['InterBold'] text-[var(--espresso)]">Arosh Ediriweera,</span>
                <br />
                Partnerships Manager{' '}
                <a className="underline hover:text-[var(--espresso)] transition-colors" href="mailto:arosh@sodax.com">
                  arosh@sodax.com
                </a>
              </p>
            </div>
          </div>
        </AnimatedStaggerChild>
      </AnimatedStaggerContainer>
    </PartnerPageLayout>
  );
}
