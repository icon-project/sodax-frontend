import Image from 'next/image';

// Local asset paths
const imgLogo = '/images/partners/amped-finance/logo.svg';
const imgLogo1 = '/images/partners/amped-finance/logo-small.svg';
const img = '/images/partners/amped-finance/sodax-symbol.svg';
const img2 = '/images/partners/amped-finance/arrow-right-1.svg';
const img3 = '/images/partners/amped-finance/arrow-right-2.svg';

export default function AmpedFinancePage() {
  return (
    <div className="bg-white flex flex-col items-center min-h-screen w-full">
      <div className="flex flex-col gap-8 items-start pt-14 pb-14 w-full max-w-7xl px-4 md:px-8">
      {/* Title */}
      <div className="flex gap-4 items-center w-full">
        <div className="relative shrink-0 w-14 h-14">
          <Image alt="Amped Finance Logo" className="object-contain" src={imgLogo} width={56} height={56} />
        </div>
        <div className="flex flex-col items-start justify-center">
          <p className="font-['InterMedium'] text-[9px] text-[var(--clay-light)] uppercase leading-tight">CASE STUDY</p>
          <p className="font-['InterBold'] text-2xl text-[var(--espresso)] leading-tight">Amped Finance</p>
          <p className="font-['InterBold'] text-sm text-[var(--clay)] leading-normal">
            Derivatives DEX on LightLink & Sonic
          </p>
        </div>
      </div>

      {/* Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 items-start min-w-0 w-full lg:w-auto">
          {/* Subtitle Box */}
          <div className="flex flex-col items-start w-full">
            <div className="bg-[var(--almost-white)] flex items-center p-3 rounded-lg w-full">
              <p className="flex-1 font-['InterRegular'] text-[11px] text-[var(--espresso)] leading-snug">
                For derivatives DEXs that want to offer cross-network asset exposure without building bridges or
                managing per-network liquidity.
              </p>
            </div>
            <div className="flex items-center justify-center w-20 h-2">
              <div className="-rotate-90">
                <svg width="80" height="8" viewBox="0 0 80 8" fill="none">
                  <path
                    d="M0 4C0 4 8 0 10 0C12 0 20 8 22 8C24 8 32 0 34 0C36 0 44 8 46 8C48 8 56 0 58 0C60 0 68 8 70 8C72 8 80 4 80 4"
                    stroke="var(--clay-light)"
                    strokeOpacity="0.3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* The Partner */}
          <div className="flex items-start w-full">
            <div className="flex-1 flex flex-col gap-2 items-start leading-normal">
              <p className="font-['InterBold'] text-xs text-[var(--espresso)] w-full">The Partner</p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full">
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
              <p className="font-['InterBold'] text-xs text-[var(--espresso)] w-full leading-normal">The Challenge</p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                LightLink tried cross-network access before, but failed:
              </p>
              <div className="flex flex-col md:flex-row gap-4 items-start w-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                    Bridged wBTC, ARB, and UNI from Ethereum, but users often had to wait up to 24 hours to bridge
                    back
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                    Required manual liquidity provisioning on DEXs, which still resulted in insufficient depth
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pt-2 border-t border-[var(--cream-white)] min-w-0">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                    Slippage issues forced users to bridge assets across networks to complete trades
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="flex flex-col gap-2 items-start w-full">
            <p className="font-['InterBold'] text-xs text-[var(--espresso)] w-full leading-normal">The Solution</p>
            <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
              SODAX's SDK gave Amped capabilities that would have taken months to build independently:
            </p>
            <div className="flex flex-col gap-2 items-start w-full">
              {/* Bullet 1 */}
              <div className="flex gap-2 items-start pt-2 border-t border-[var(--cream-white)] w-full">
                <div className="bg-[var(--cherry-brighter)] flex flex-col items-center justify-center rounded-full shrink-0 w-4 h-4">
                  <p className="font-['InterBold'] text-[8px] text-white leading-normal">1</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                  <p className="font-['InterBold'] text-[11px] text-[var(--cherry-soda)] w-full leading-snug">
                    Intent-Based Swaps
                  </p>
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
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
                  <p className="font-['InterBold'] text-[11px] text-[var(--cherry-soda)] w-full leading-snug">
                    Multi-Chain Money Market in Days
                  </p>
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
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
                  <p className="font-['InterBold'] text-[11px] text-[var(--cherry-soda)] w-full leading-snug">
                    Deep Liquidity from Day One
                  </p>
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                    Instead of manually funding pools, Amped accessed SODAX's $6M+ protocol-owned liquidity across BTC,
                    ETH, SOL, SUI, and AVAX.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-[var(--almost-white)] flex flex-col gap-2 items-start px-2 py-4 rounded-lg shrink-0 w-full lg:w-[166px]">
          <div className="flex-1 flex flex-col gap-4 items-start w-full">
            {/* At a glance */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-xs text-[var(--cherry-bright)] w-full leading-normal">At a glance</p>
              <ul className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full list-disc ml-4 space-y-1">
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
              <p className="font-['InterBold'] text-xs text-[var(--cherry-bright)] w-full leading-normal">About Amped</p>
              <div className="flex gap-2 items-start w-full">
                <div className="flex flex-col gap-1 items-start shrink-0">
                  <div className="bg-[var(--cream-white)] flex flex-col h-6 items-center justify-center px-2 rounded shrink-0 w-full">
                    <p className="font-['InterMedium'] text-[9px] text-[var(--espresso)] uppercase leading-tight">$4.4M</p>
                  </div>
                  <div className="bg-[var(--cream-white)] flex flex-col h-6 items-center justify-center px-2 rounded shrink-0 w-full">
                    <p className="font-['InterMedium'] text-[9px] text-[var(--espresso)] uppercase leading-tight">$1M+</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
                  <div className="flex flex-col h-6 items-center justify-center w-full">
                    <p className="font-['InterRegular'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                      30-day DEX Volume
                    </p>
                  </div>
                  <div className="flex flex-col h-6 items-center justify-center w-full">
                    <p className="font-['InterRegular'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                      Protocol Fee Revenue
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--cream-white)]" />

            {/* Quote */}
            <div className="flex flex-col gap-2 items-start w-full">
              <p className="font-['InterBold'] text-xs text-[var(--cherry-bright)] w-full leading-normal">Quote</p>
              <p className="font-['InterRegular'] text-[11px] text-[var(--clay-light)] w-full leading-snug">
                "SODAX gives us access to deep, cross-chain liquidity, which improves execution and creates a better
                trading experience across the board."
              </p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full text-right">
                <span className="font-['InterBold'] text-[var(--espresso)]">— Daniel Enright</span>
                <br />
                Founder of Amped Finance, Ecosystem Lead at LightLink
              </p>
            </div>
          </div>

          {/* References */}
          <div className="flex gap-1 items-start pt-2 border-t border-[var(--cream-white)] font-['InterRegular'] text-[8px] w-full leading-normal">
            <p className="text-[var(--clay)]">References</p>
            <a className="text-[var(--espresso)] underline" href="https://www.amped.finance/" target="_blank" rel="noopener noreferrer">
              Website
            </a>
            <a className="text-[var(--espresso)] underline" href="https://x.com/AmpedFinance" target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[var(--almost-white)] flex flex-col lg:flex-row gap-4 items-start p-4 md:p-8 w-full rounded-lg">
        {/* Amped Results */}
        <div className="flex-1 flex flex-col gap-2 items-start min-w-0 w-full lg:w-auto">
          <div className="flex gap-1 items-center w-full">
            <div className="relative shrink-0 w-3 h-3">
              <Image alt="Logo" className="object-contain" src={imgLogo1} width={12} height={12} />
            </div>
            <p className="font-['InterBold'] text-xs text-[var(--espresso)] leading-normal">Amped Results</p>
          </div>
          <div className="flex flex-wrap gap-2 items-start pb-2 w-full">
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full sm:w-[170px]">
              <p className="font-['InterBold'] text-[8px] text-[var(--espresso)] w-full leading-normal">2-4 day launch</p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                From initial exploration to live money market launch using the SDK
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full sm:w-[170px]">
              <p className="font-['InterBold'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                Zero extra dev work
              </p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                "The SDK is quite thorough. We haven't felt the need to do extra developmental work."
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full sm:w-[170px]">
              <p className="font-['InterBold'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                Intent-based swaps live
              </p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                Cross-network trading now available to Amped users via SODAX's solver network
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full sm:w-[170px]">
              <p className="font-['InterBold'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                LightLink's primary bridge
              </p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                Amped provides the LightLink Network's primary interface for cross-network asset movement
              </p>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center pl-4 py-2 border-l border-[var(--cream-white)] w-full sm:w-[170px]">
              <p className="font-['InterBold'] text-[8px] text-[var(--espresso)] w-full leading-normal">
                New products unlocked
              </p>
              <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] w-full leading-normal">
                Enabled cross-network token index pools, allowing users to access diversified exposure across
                ecosystems in a single transaction
              </p>
            </div>
          </div>
        </div>

        {/* SODAX Integration & Get started */}
        <div className="flex flex-col h-full items-start justify-between shrink-0 w-full lg:w-auto">
          {/* SODAX Integration */}
          <div className="flex flex-col gap-2 items-start rounded-lg shrink-0 w-full lg:w-[166px]">
            <div className="flex gap-1 items-center w-full">
              <div className="relative shrink-0 w-3 h-3">
                <Image alt="SODAX symbol" className="object-contain mix-blend-multiply" src={img} width={12} height={12} />
              </div>
              <p className="flex-1 font-['InterBold'] text-xs text-[var(--espresso)] leading-normal min-w-0">
                SODAX Integration
              </p>
            </div>
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center justify-center w-[72px] h-2">
                <div className="rotate-90">
                  <svg width="40" height="8" viewBox="0 0 40 8" fill="none">
                    <path
                      d="M0 4C0 4 8 0 10 0C12 0 20 8 22 8C24 8 32 0 34 0C36 0 40 4 40 4"
                      stroke="var(--cream-white)"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-start w-full">
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[166px]">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] leading-normal">
                    Foundation Layer
                  </p>
                  <div className="flex flex-col items-start text-[6px] w-full leading-tight">
                    <p className="font-['InterBold'] text-[var(--espresso)] w-full">@SODAX/SDK</p>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      This is the core logic that powers the entire ecosystem. It provides the raw functional modules
                      required to build with SODAX programmatically.
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[166px]">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] leading-normal">
                    Connection Layer
                  </p>
                  <div className="flex flex-col items-start text-[6px] w-full leading-tight">
                    <p className="font-['InterBold'] text-[var(--espresso)] w-full">@SODAX/WALLET-SDK-REACT</p>
                    <p className="font-['InterRegular'] text-[var(--clay-dark)] w-full">
                      An opinionated wrapper optimized for React applications, providing pre-built context providers and
                      state management for wallet connections.
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--cream-white)] flex flex-col gap-1 items-start justify-center p-2 rounded-lg shrink-0 w-full lg:w-[166px]">
                  <p className="font-['InterRegular'] text-[8px] text-[var(--clay-dark)] leading-normal">
                    Experience Layer
                  </p>
                  <div className="flex flex-col items-start text-[6px] w-full leading-tight">
                    <p className="font-['InterBold'] text-[var(--espresso)] w-full">@SODAX/DAPP-KIT</p>
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
          <div className="flex flex-col gap-2 items-start pt-6 w-full lg:w-auto">
            <div className="flex gap-1 items-center w-full">
              <div className="relative shrink-0 w-3 h-3">
                <Image alt="SODAX symbol" className="object-contain mix-blend-multiply" src={img} width={12} height={12} />
              </div>
              <p className="flex-1 font-['InterBold'] text-xs text-[var(--espresso)] leading-normal min-w-0">
                Get started
              </p>
            </div>
            <div className="flex flex-col gap-2 items-start shrink-0 w-full lg:w-[166px]">
              <div className="font-['InterRegular'] text-[var(--clay)] leading-tight">
                <p className="font-['InterBold'] text-[8px] mb-1.5">Arosh Ediriweera,</p>
                <p className="text-[6px] leading-tight">
                  Partnerships Manager{' '}
                  <a className="underline" href="mailto:arosh@sodax.com">
                    arosh@sodax.com
                  </a>
                </p>
              </div>
              <a
                className="bg-[var(--cherry-bright)] flex gap-0.5 items-center justify-center px-2.5 py-1.5 rounded-full shrink-0"
                href="https://www.sodax.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="font-['InterRegular'] text-[7.2px] text-white text-center leading-normal">
                  sodax.com
                </span>
                <div className="overflow-clip relative shrink-0 w-4 h-4">
                  <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2">
                    <Image alt="" src={img2} width={16} height={16} />
                  </div>
                  <div className="absolute bottom-[20.83%] left-1/2 right-[20.83%] top-[20.83%]">
                    <Image alt="" src={img3} width={16} height={16} />
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
