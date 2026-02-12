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
const imgLogo = '/partners/lightlink-network/logo.svg';
const imgLogoSmall = '/partners/lightlink-network/logo.svg';
const img = '/partners/sodax-symbol.svg';
const pdfDeck = '/partners/lightlink-network/SODAX - Lightlink Network.pdf';

const partnerMetadata = {
  partnerName: 'LightLink Network',
  tagline: 'Ethereum Layer 2',
  description:
    'How LightLink integrated SODAX at the network layer to give applications access to cross-network liquidity and execution across 14+ networks. Users can now trade assets like BTC, SOL, and AVAX without bridging delays.',
  logoUrl: imgLogo,
};

export const metadata: Metadata = generatePartnerMetadata(partnerMetadata);

export default function LightLinkNetworkPage() {
  return (
    <PartnerPageLayout metadata={partnerMetadata}>
      {/* Title */}
      <AnimatedSection className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 w-full">
        <div className="flex gap-3 md:gap-4 items-center">
          <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
            <Image alt="LightLink Logo" className="object-contain" src={imgLogo} width={80} height={80} />
          </div>
          <div className="flex flex-col items-start justify-center">
            <p className="font-['InterMedium'] text-xs md:text-sm text-[var(--clay-light)] uppercase leading-tight tracking-wider">
              CASE STUDY
            </p>
            <p className="font-['InterBold'] text-2xl md:text-3xl lg:text-4xl text-[var(--espresso)] leading-tight">
              LightLink Network
            </p>
            <p className="font-['InterBold'] text-sm md:text-base lg:text-lg text-[var(--clay)] leading-normal">
              Ethereum Layer 2
            </p>
          </div>
        </div>
        <PageActions
          pdfUrl={pdfDeck}
          pdfTitle="SODAX - LightLink Network Case Study"
          shareTitle="LightLink Network Case Study | SODAX Partners"
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
                For Layer 2 networks that want to give apps access to cross-network liquidity and execution without
                maintaining bespoke bridging or liquidity coordination.
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
                LightLink is an Ethereum Layer 2 designed to support scalable, low-friction applications through chain
                abstraction and gasless transaction infrastructure. As the network evolved, its focus expanded toward
                enabling applications to access cross-network assets, liquidity, and execution. This is done without
                exposing end users or businesses to gas management or multi-chain operational complexity.
              </p>
            </div>
          </AnimatedStaggerChild>

          {/* The Challenge */}
          <AnimatedStaggerChild className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start">
              <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Challenge</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                LightLink's ecosystem was constrained by limited access to cross-network assets and liquidity. While
                core assets like ETH, LL, and stablecoins were available natively, applications could not easily support
                assets such as BTC, SOL, AVAX, or other major markets without leaving the network or relying on bespoke
                integrations. This resulted in several structural limitations:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start w-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Limited asset coverage meant applications could not offer native access to assets like BTC, SOL, or
                    AVAX on LightLink.
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Slow execution paths forced users to rely on transfers with long confirmation times to reach assets
                    on other networks.
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Fragmented liquidity resulted in shallow markets and inconsistent pricing, even when assets were
                    made available.
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Developer overhead increased due to custom integrations and ongoing liquidity management.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedStaggerChild>

          {/* The Solution */}
          <AnimatedStaggerChild className="flex flex-col gap-2 items-start w-full">
            <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Solution</p>
            <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
              SODAX integrated at the LightLink network layer, enabling applications deployed on LightLink to access
              cross-network liquidity and execution without managing local pools.
            </p>
            <div className="flex flex-col gap-2 items-start w-full">
              {/* Bullet 1 */}
              <div className="flex gap-2 items-start py-4 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">1</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Unified Liquidity Layer
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    LightLink integrated SODAX's Core SDK at the network level, allowing applications on LightLink to
                    access deep liquidity across 14+ connected networks, including Solana, Sui, Avalanche, Arbitrum, and
                    Stellar. Applications no longer need to fund or manage local liquidity pools to offer multi-asset
                    access.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Impact:</span> Users no longer wait 24 hours or navigate
                    bridge flows. They specify an intent like "I want SOL," and trades settle with deep liquidity, low
                    slippage, and no manual bridging steps.
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
                    Native Asset Representation
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    SODAX introduced native asset representations for LightLink, allowing applications to expose assets
                    like SUI.LL, BTC.LL, and AVAX.LL under LightLink-native naming standards. Settlement remains fully
                    compatible with the broader SODAX ecosystem.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Impact:</span> Users interact with familiar, network-native
                    asset names and trade directly, without needing to understand wrapped tokens, bridges, or
                    cross-network mechanics.
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
                    Intent-Based Execution
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Applications on LightLink execute trades through SODAX's solver network, which sources liquidity
                    across all connected networks instead of relying on shallow local AMMs. Execution is coordinated
                    externally while the user interaction and settlement remain native to the LightLink environment.
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal mt-2">
                    <span className="font-['InterMedium']">Impact:</span> Users can execute both small and large trades
                    with consistent pricing and minimal slippage.
                  </p>
                </div>
              </div>

              {/* Bullet 4 */}
              <div className="flex gap-2 items-start py-4 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">4</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Direct SDK Integration for Builders
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Protocols building on LightLink can integrate SODAX through the Core SDK to support cross-network
                    execution without building bespoke coordination infrastructure. LightLink apps already use SODAX to
                    offer index-style products that execute exposure across assets like BTC, ETH, SOL, and LL in a
                    single user action.
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
                  <span className="font-['InterBold']">2 weeks</span> to integrate
                </li>
                <li>
                  <span className="font-['InterBold']">2-4 days</span> to launch money market
                </li>
                <li>
                  <span className="font-['InterBold']">14+</span> networks now accessible
                </li>
                <li>
                  <span className="font-['InterBold']">No</span> user-visible bridging delays
                </li>
              </ul>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* About LightLink */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">
                About LightLink
              </p>
              <div className="flex flex-col gap-1 items-start w-full">
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">$11.5M</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">
                    Funding from top-tier investors
                  </p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">67k+</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">Daily transactions</p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">78M+</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">Transactions handled</p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">1.5M+</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">
                    Accounts have used gasless transactions
                  </p>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start px-3 py-2 rounded w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">50+</p>
                  <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)]">
                    Partnerships (Including Animoca, Lamborghini, Rarible)
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* Quote */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">Quote</p>
              <p className="font-['InterRegular'] text-base text-[var(--clay-light)] w-full leading-relaxed">
                "With SODAX, we can offer DeFi traders access to a wider range of assets without requiring them to leave
                the LightLink ecosystem. It enables us to support cross-chain index pools without managing complex
                infrastructure, making it a strong complement to LightLink's mission."
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full text-right">
                <span className="font-['InterBold'] text-[var(--espresso)]">
                  — Daniel Enright, Ecosystem Lead at LightLink
                </span>
              </p>
            </div>
          </div>

          {/* References */}
          <div className="flex flex-col gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
            <p className="font-['InterRegular'] text-sm text-[var(--clay)] leading-normal">References</p>
            <div className="flex gap-2 items-center">
              <a
                href="https://lightlink.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 px-3 py-1.5 min-w-[110px] bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors"
              >
                <Globe size={14} className="text-[var(--espresso)]" />
                <span className="font-['InterMedium'] text-sm text-[var(--espresso)]">Website</span>
              </a>
              <a
                href="https://twitter.com/lightaboratory"
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
        {/* Network-Level Outcomes */}
        <AnimatedFadeIn className="flex-1 flex flex-col gap-2 items-start min-w-0 w-full lg:w-auto">
          <div className="flex gap-1 items-center w-full">
            <div className="relative shrink-0 w-4 h-4">
              <Image alt="Logo" className="object-contain" src={imgLogoSmall} width={16} height={16} />
            </div>
            <p className="font-['InterBold'] text-base md:text-lg text-[var(--espresso)] leading-normal">
              Network-Level Outcomes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-2 items-start pb-2 w-full">
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Expanded Asset Access
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                LightLink expanded from a small set of native assets (ETH, LL, stablecoins) to deep liquidity across 14+
                connected networks, giving applications immediate access to major assets like BTC, SOL, AVAX, and more.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Eliminated Bridge Friction
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Users no longer rely on manual bridges or long confirmation paths. Cross-network swaps execute through
                SODAX with native UX and predictable settlement.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                New App Capabilities
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Applications on LightLink can offer multi-asset and cross-network products, such as diversified exposure
                across BTC, ETH, SOL, and other assets, executed in a single user action. These product designs were
                previously impractical due to fragmented liquidity and bridge coordination.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">Proven Traction</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                LightLink hosts 50+ active applications and processes ~67,000 transactions per day. SODAX extends this
                activity with cross-network execution and liquidity access at the network layer.
              </p>
            </div>
          </div>
        </AnimatedFadeIn>

        {/* SODAX Integration & Get started */}
        <AnimatedStaggerChild className="flex flex-col items-start justify-start gap-6 shrink-0 w-full lg:w-auto">
          {/* SODAX SDK Components */}
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
                SODAX SDK Components
              </p>
            </div>
            <p className="font-['InterRegular'] text-xs text-[var(--clay)] leading-normal">Available to builders on LightLink</p>
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
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[280px]">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-normal">
                    Connection Layer
                  </p>
                  <div className="flex flex-col items-start text-xs w-full leading-tight">
                    <a
                      href="https://docs.sodax.com/developers/packages/wallet-sdk-core"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline"
                    >
                      @SODAX/WALLET-SDK-CORE
                    </a>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      A pure TypeScript implementation of wallet providers. Use this if you are building a custom
                      frontend framework or a non-React application.
                    </p>
                  </div>
                  <div className="flex flex-col items-start text-xs w-full leading-tight mt-2">
                    <a
                      href="https://docs.sodax.com/developers/packages/wallet-sdk-react"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline"
                    >
                      @SODAX/WALLET-SDK-REACT
                    </a>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      An opinionated wrapper optimized for React applications, providing pre-built context providers and
                      state management for wallet connections.
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[280px]">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-normal">
                    Experience Layer
                  </p>
                  <div className="flex flex-col items-start text-xs w-full leading-tight">
                    <a
                      href="https://docs.sodax.com/developers/packages/dapp-kit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline"
                    >
                      @SODAX/DAPP-KIT
                    </a>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      The fastest way to build with SODAX. This is an opinionated collection of UI components, hooks,
                      and utilities that leverages the layers below it.
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
