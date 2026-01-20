import Image from 'next/image';
import { PartnerPageLayout, generatePartnerMetadata } from '@/components/partners/partner-page-layout';
import type { Metadata } from 'next';
import { Globe, BookOpen } from 'lucide-react';
import { ShareButton } from '@/components/partners/share-button';

// Local asset paths
const imgLogo = '/partners/amped-finance/logo.svg';
const imgLogo1 = '/partners/amped-finance/logo-small.svg';
const img = '/partners/sodax-symbol.svg';

const partnerMetadata = {
  partnerName: 'Amped Finance',
  tagline: 'Derivatives DEX on LightLink & Sonic',
  description: 'How Amped Finance, a derivatives DEX on LightLink & Sonic, launched their multi-chain money market in 2-4 days using SODAX SDK. Intent-based swaps, deep liquidity from day one, and 14+ networks accessible.',
  logoUrl: imgLogo,
  metrics: {
    volume: '$4.4M',
    revenue: '$1M+'
  }
};

export const metadata: Metadata = generatePartnerMetadata(partnerMetadata);

export default function AmpedFinancePage() {
  return (
    <PartnerPageLayout metadata={partnerMetadata}>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 w-full">
        <div className="flex gap-3 md:gap-4 items-center">
          <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
            <Image alt="Amped Finance Logo" className="object-contain" src={imgLogo} width={80} height={80} />
          </div>
          <div className="flex flex-col items-start justify-center">
            <p className="font-['InterMedium'] text-xs md:text-sm text-[var(--clay-light)] uppercase leading-tight tracking-wider">CASE STUDY</p>
            <p className="font-['InterBold'] text-2xl md:text-3xl lg:text-4xl text-[var(--espresso)] leading-tight">Amped Finance</p>
            <p className="font-['InterBold'] text-sm md:text-base lg:text-lg text-[var(--clay)] leading-normal">
              Derivatives DEX on LightLink & Sonic
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <a
            href="https://docs.sodax.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--espresso)] hover:bg-[var(--clay-dark)] text-white rounded-lg transition-colors shrink-0 text-center"
          >
            <BookOpen size={16} />
            <span className="font-['InterMedium'] text-sm">SODAX SDK</span>
          </a>
          <ShareButton title="Amped Finance Case Study | SODAX Partners" />
        </div>
      </div>

      {/* Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 items-start min-w-0 w-full lg:w-auto">
          {/* Subtitle Box */}
          <div className="flex flex-col items-start w-full">
            <div className="bg-[var(--almost-white)] flex items-center p-3 md:p-4 rounded-lg w-full relative">
              <p className="flex-1 font-['InterRegular'] text-sm md:text-base text-[var(--espresso)] leading-relaxed">
                For derivatives DEXs that want to offer cross-network asset exposure without building bridges or
                managing per-network liquidity.
              </p>
            </div>
            <div className="flex justify-start w-full -mt-[1px]">
              <svg width="80" height="8" viewBox="0 0 80 8" fill="none" className="ml-4">
                <path fillRule="evenodd" clipRule="evenodd" d="M40 8C39.0625 8 38.5871 7.52943 38.3333 7.05882C35.8368 2.42816 29.0165 1.56476e-06 20 2.0664e-06L60 -1.59051e-07C50.9835 3.42592e-07 44.1632 2.42816 41.6667 7.05882C41.4129 7.52943 40.9375 8 40 8Z" fill="var(--almost-white)"/>
              </svg>
            </div>
          </div>

          {/* The Partner */}
          <div className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start leading-normal">
              <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full">The Partner</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full">
                Amped Finance is a derivatives DEX on LightLink and Sonic, founded by Daniel Enright, who also serves
                as Ecosystem Lead at LightLink. At the time, the LightLink ecosystem supported a limited set of assets,
                primarily ETH, LL, and stablecoins. Amped wanted to offer traders exposure to BTC, SOL, and AVAX without
                forcing users to leave the network.
              </p>
            </div>
          </div>

          {/* The Challenge */}
          <div className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start">
              <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Challenge</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Amped tried cross-network access before, but failed:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start w-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Bridged wBTC, ARB, and UNI from Ethereum, but users often had to wait up to 24 hours to bridge
                    back
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Required manual liquidity provisioning on DEXs, which still resulted in insufficient depth
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0 w-full">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Slippage issues forced users to bridge assets across networks to complete trades
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="flex flex-col gap-2 items-start w-full">
            <p className="font-['InterBold'] text-lg text-[var(--espresso)] w-full leading-normal">The Solution</p>
            <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
              SODAX's SDK gave Amped capabilities that would have taken months to build independently:
            </p>
            <div className="flex flex-col gap-2 items-start w-full">
              {/* Bullet 1 */}
              <div className="flex gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">1</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Intent-Based Swaps
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Amped now offers cross-network swaps powered by SODAX's intent-based execution. Users can swap
                    assets across 14+ networks without leaving the Amped interface. Solvers handle routing and
                    settlement automatically.
                  </p>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">2</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Multi-Chain Money Market in Days
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Amped went from exploring a money market build to launching it in 2–4 days using the SDK. No custom
                    smart contract development or liquidity bootstrapping was required.
                  </p>
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">3</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-sm text-[var(--cherry-soda)] w-full leading-snug">
                    Deep Liquidity from Day One
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                    Instead of manually funding pools, Amped accessed SODAX's $6M+ protocol-owned liquidity across BTC,
                    ETH, SOL, SUI, and AVAX.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-[var(--almost-white)] flex flex-col gap-2 items-start p-4 rounded-lg shrink-0 w-full lg:w-[280px]">
          <div className="flex-1 flex flex-col gap-4 items-start w-full">
            {/* At a glance */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">At a glance</p>
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
                  <span className="font-['InterBold']">No</span> custom smart contract or liquidity bootstrapping required
                </li>
                <li>Primary cross-network execution interface for LightLink</li>
              </ul>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* About Amped */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">About Amped</p>
              <div className="flex gap-2 items-start w-full">
                <div className="flex flex-col gap-1 items-start shrink-0">
                  <div className="bg-[var(--cream-white)] flex flex-col h-6 items-center justify-center px-2 rounded shrink-0 w-full">
                    <p className="font-['InterMedium'] text-sm text-[var(--espresso)] uppercase leading-tight">$4.4M</p>
                  </div>
                  <div className="bg-[var(--cream-white)] flex flex-col h-6 items-center justify-center px-2 rounded shrink-0 w-full">
                    <p className="font-['InterMedium'] text-sm text-[var(--espresso)] uppercase leading-tight">$1M+</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                  <div className="flex flex-col h-6 items-center justify-center w-full">
                    <p className="font-['InterRegular'] text-sm text-[var(--espresso)] w-full leading-normal">
                      30-day DEX Volume
                    </p>
                  </div>
                  <div className="flex flex-col h-6 items-center justify-center w-full">
                    <p className="font-['InterRegular'] text-sm text-[var(--espresso)] w-full leading-normal">
                      Protocol Fee Revenue
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* Quote */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-lg text-[var(--cherry-bright)] w-full leading-normal">Quote</p>
              <p className="font-['InterRegular'] text-base text-[var(--clay-light)] w-full leading-relaxed">
                "SODAX gives us access to deep, cross-chain liquidity, which improves execution and creates a better
                trading experience across the board."
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full text-right">
                <span className="font-['InterBold'] text-[var(--espresso)]">— Daniel Enright</span>
                <br />
                Founder of Amped Finance
              </p>
            </div>
          </div>

          {/* References */}
          <div className="flex flex-col gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
            <p className="font-['InterRegular'] text-sm text-[var(--clay)] leading-normal">References</p>
            <div className="flex gap-2 items-center">
              <a 
                href="https://www.amped.finance/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 px-3 py-1.5 min-w-[110px] bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors"
              >
                <Globe size={14} className="text-[var(--espresso)]" />
                <span className="font-['InterMedium'] text-sm text-[var(--espresso)]">Website</span>
              </a>
              <a 
                href="https://x.com/AmpedFinance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center h-9 justify-center px-3 py-1.5 min-w-[110px] bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--espresso)]">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[var(--almost-white)] flex flex-col lg:flex-row gap-6 md:gap-4 items-start p-3 md:p-6 lg:p-8 w-full rounded-lg">
        {/* Amped Results */}
        <div className="flex-1 flex flex-col gap-2 items-start min-w-0 w-full lg:w-auto">
          <div className="flex gap-1 items-center w-full">
            <div className="relative shrink-0 w-4 h-4">
              <Image alt="Logo" className="object-contain" src={imgLogo1} width={16} height={16} />
            </div>
            <p className="font-['InterBold'] text-base md:text-lg text-[var(--espresso)] leading-normal">Amped Results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-2 items-start pb-2 w-full">
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">2-4 day launch</p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                From initial exploration to live money market launch using the SDK
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Zero extra dev work
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                "The SDK is quite thorough. We haven't felt the need to do extra developmental work."
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                Intent-based swaps live
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Cross-network trading now available to Amped users via SODAX's solver network
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                LightLink's primary bridge
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Amped provides the LightLink Network's primary interface for cross-network asset movement
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full lg:w-[170px]">
              <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-normal">
                New products unlocked
              </p>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-normal">
                Enabled cross-network token index pools, allowing users to access diversified exposure across
                ecosystems in a single transaction
              </p>
            </div>
          </div>
        </div>

        {/* SODAX Integration & Get started */}
        <div className="flex flex-col items-start justify-start gap-6 shrink-0 w-full lg:w-auto">
          {/* SODAX Integration */}
          <div className="flex flex-col gap-2 items-start rounded-lg shrink-0 w-full lg:w-[280px]">
            <div className="flex gap-1 items-center w-full">
              <div className="relative shrink-0 w-4 h-4">
                <Image alt="SODAX symbol" className="object-contain mix-blend-multiply" src={img} width={16} height={16} />
              </div>
              <p className="flex-1 font-['InterBold'] text-sm text-[var(--espresso)] leading-normal min-w-0">
                SODAX Integration
              </p>
            </div>
            <div className="flex flex-col items-start w-full">
              <div className="flex flex-col gap-3 items-start w-full">
                <div className="flex justify-start w-full mb-[-12px]">
                  <svg width="80" height="8" viewBox="0 0 80 8" fill="none" className="ml-2 rotate-180">
                    <path fillRule="evenodd" clipRule="evenodd" d="M40 8C39.0625 8 38.5871 7.52943 38.3333 7.05882C35.8368 2.42816 29.0165 1.56476e-06 20 2.0664e-06L60 -1.59051e-07C50.9835 3.42592e-07 44.1632 2.42816 41.6667 7.05882C41.4129 7.52943 40.9375 8 40 8Z" fill="var(--cream-white)"/>
                  </svg>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[280px]">
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-normal">
                    Foundation Layer
                  </p>
                  <div className="flex flex-col items-start text-xs w-full leading-tight">
                    <a href="https://docs.sodax.com/developers/packages/sdk" target="_blank" rel="noopener noreferrer" className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline">@SODAX/SDK</a>
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
                    <a href="https://docs.sodax.com/developers/packages/wallet-sdk-react" target="_blank" rel="noopener noreferrer" className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline">@SODAX/WALLET-SDK-REACT</a>
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
                    <a href="https://docs.sodax.com/developers/packages/dapp-kit" target="_blank" rel="noopener noreferrer" className="font-['InterBold'] text-[var(--espresso)] w-full hover:underline">@SODAX/DAPP-KIT</a>
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
                <Image alt="SODAX symbol" className="object-contain mix-blend-multiply" src={img} width={16} height={16} />
              </div>
              <p className="flex-1 font-['InterBold'] text-sm text-[var(--espresso)] leading-normal min-w-0">
                Get started
              </p>
            </div>
            <div className="flex flex-col gap-2 items-start shrink-0 w-full lg:w-[280px]">
              <p className="font-['InterRegular'] text-sm text-[var(--clay)] leading-tight">
                Partnerships Manager{' '}
                <a className="underline hover:text-[var(--espresso)] transition-colors" href="mailto:arosh@sodax.com">
                  arosh@sodax.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PartnerPageLayout>
  );
}
