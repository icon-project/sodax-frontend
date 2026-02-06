import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import { PartnerSimpleFooter } from '@/components/partners/partner-simple-footer';
import { PageActions } from '@/components/partners/page-actions';
import { AnimatedSection, AnimatedScrollSection } from '@/components/partners/animated-section';

// Local asset paths
const pdfDeck = '/partners/sodax-sdk/SODAX-SDK-Deck.pdf';
const imgSodaxSymbol = '/partners/sodax-sdk/sodax-symbol-large.svg';
const imgAppMockup = '/partners/sodax-sdk/app-mockup.png';
const imgLaptopMockup = '/partners/sodax-sdk/laptop-mockup.png';

// Partner logos
const imgLogoHoudini = '/partners/sodax-sdk/logo-houdini.svg';
const imgLogoBalanced1 = '/partners/sodax-sdk/logo-balanced-1.svg';
const imgLogoAmped1 = '/partners/sodax-sdk/logo-amped-1.svg';
const imgLogoAmped2 = '/partners/sodax-sdk/logo-amped-2.svg';
const imgLogoHana = '/partners/sodax-sdk/logo-hana.svg';
const imgLogoSommSymbol = '/partners/sodax-sdk/logo-somm-symbol.svg';
const imgLogoSommWord = '/partners/sodax-sdk/logo-somm-word.svg';
const imgLogoSuperposition = '/partners/sodax-sdk/logo-superposition.png';
const imgLogoRadfi = '/partners/sodax-sdk/logo-radfi.png';
const imgLogo1inch = '/partners/sodax-sdk/logo-1inch.svg';

// Team photos
const imgMinKim = '/partners/sodax-sdk/team-min-kim.png';
const imgArosh = '/partners/sodax-sdk/team-arosh.png';
const imgFez = '/partners/sodax-sdk/team-fez-1.png';
const imgAnton = '/partners/sodax-sdk/team-anton-andell.png';

// SODA token
const imgSodaToken = '/partners/sodax-sdk/soda-token.svg';

export const metadata: Metadata = {
  title: 'SODAX SDK | Infrastructure for Cross-Network DeFi',
  description:
    'Give your users access to over 50 assets without setting up from scratch. SODAX SDK provides cross-network execution, money market integration, and bnUSD minting access across 14+ networks.',
  openGraph: {
    title: 'SODAX SDK | Infrastructure for Cross-Network DeFi',
    description:
      'Give your users access to over 50 assets without setting up from scratch. SODAX SDK provides cross-network execution, money market integration, and bnUSD minting access across 14+ networks.',
    type: 'website',
    images: ['/partners/sodax-sdk/link-preview.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX SDK | Infrastructure for Cross-Network DeFi',
    description:
      'Give your users access to over 50 assets without setting up from scratch. SODAX SDK provides cross-network execution, money market integration, and bnUSD minting access across 14+ networks.',
    images: ['/partners/sodax-sdk/link-preview.png'],
  },
};

// Partner Logo Component
function PartnerLogo({
  children,
  description,
}: {
  children: React.ReactNode;
  description: string;
}) {
  return (
    <div className="border-l border-[var(--cherry-grey)] flex flex-col gap-2 h-14 items-start justify-center pl-3">
      <div className="h-7 overflow-clip flex items-center">{children}</div>
      <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">{description}</p>
    </div>
  );
}

// Stat Item Component
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-[var(--cherry-grey)] flex flex-col gap-1 items-start pl-3">
      <p className="font-['InterBold'] text-lg text-[var(--espresso)] leading-tight">{value}</p>
      <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">{label}</p>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[var(--almost-white)] flex-1 flex flex-col gap-2 items-start p-6 rounded-2xl min-w-[180px]">
      <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-tight">{title}</p>
      <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-relaxed">{description}</p>
    </div>
  );
}

// Ideal For Card Component
function IdealForCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[var(--almost-white)] flex flex-col items-start px-4 py-6 rounded-2xl">
      <p className="font-['InterBold'] text-sm text-[var(--espresso)] w-full leading-snug">{title}</p>
      <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-relaxed">{description}</p>
    </div>
  );
}

// Team Member Component
function TeamMember({
  name,
  jobTitle,
  email,
  imageSrc,
  size = 'small',
}: {
  name: string;
  jobTitle: string;
  email?: string;
  imageSrc: string;
  size?: 'small' | 'large';
}) {
  const imageSize = size === 'large' ? 56 : 32;

  return (
    <div className="flex gap-2 items-center">
      <div className={`overflow-hidden rounded-full shrink-0 ${size === 'large' ? 'w-14 h-14' : 'w-8 h-8'}`}>
        <Image src={imageSrc} alt={name} width={imageSize} height={imageSize} className="object-cover w-full h-full" />
      </div>
      <div className="flex flex-col items-start justify-center">
        <p
          className={`font-['InterBold'] text-[var(--espresso)] ${size === 'large' ? 'text-sm' : 'text-xs'} leading-relaxed`}
        >
          {name}
        </p>
        <p
          className={`font-['InterRegular'] text-[var(--clay-dark)] ${size === 'large' ? 'text-xs' : 'text-xs'} leading-tight`}
        >
          {jobTitle}
          {email && (
            <>
              <br />
              <a href={`mailto:${email}`} className="underline hover:text-[var(--espresso)]">
                {email}
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function SodaxSDKPage() {
  return (
    <div className="relative bg-white flex flex-col min-h-screen w-full">
      <MarketingHeader />

      <div className="flex flex-col items-center w-full pt-[100px]">
        <div className="flex flex-col gap-8 items-start pt-14 pb-14 w-full max-w-5xl px-4 md:px-8">
          {/* ============================================ */}
          {/* FRAME 1: SODAX SDK Overview */}
          {/* ============================================ */}

          {/* Header Section */}
          <AnimatedSection className="flex flex-col gap-6 items-start w-full mb-16">
            {/* Page Actions */}
            <div className="flex justify-end w-full">
              <PageActions
                pdfUrl={pdfDeck}
                pdfTitle="SODAX SDK Deck"
                shareTitle="SODAX SDK | Infrastructure for Cross-Network DeFi"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              {/* Left Column - Main Content (2/3) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Tagline */}
                <div className="flex flex-col items-start w-full">
                  <p className="font-['InterBold'] text-base text-[var(--espresso)] uppercase tracking-wide">
                    Infrastructure for Cross-Network DeFi
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                    Give your users access to over 50 assets without setting up from scratch. Designed for fast
                    integration with minimal setup.
                  </p>
                </div>

                {/* Title with Logo */}
                <div className="flex items-center gap-4 md:gap-6 w-full">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                    <Image src={imgSodaxSymbol} alt="SODAX Symbol" width={88} height={88} className="object-contain" />
                  </div>
                  <h1 className="font-['InterBlack'] text-4xl md:text-6xl lg:text-7xl text-[var(--espresso)] leading-none">
                    SODAX <span className="text-[#ecc100]">SDK</span>
                  </h1>
                </div>
              </div>

              {/* Right Column - Contact CTA (1/3) */}
              <div className="lg:col-span-1 flex flex-col gap-4 items-start lg:items-end justify-start lg:pt-8">
                <div className="bg-[var(--almost-white)] rounded-2xl p-6 flex flex-col gap-4 items-start lg:items-end">
                  <h2 className="font-['InterBlack'] text-xl md:text-2xl text-[var(--espresso)] text-left lg:text-right leading-tight">
                    READY TO GO
                    <br />
                    CROSS-NETWORK?
                  </h2>
                  <div className="flex flex-row lg:flex-col gap-3">
                    <TeamMember name="Min Kim" jobTitle="Founder & President" imageSrc={imgMinKim} size="large" />
                    <TeamMember
                      name="Arosh Ediriweera"
                      jobTitle="Partnerships Manager"
                      imageSrc={imgArosh}
                      size="large"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 items-center lg:justify-end">
                    <a
                      href="https://docs.sodax.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[var(--cherry-soda)] hover:bg-[var(--espresso)] transition-colors text-white font-['InterMedium'] text-sm px-5 py-2.5 rounded-full"
                    >
                      Explore Documentation
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href="mailto:partnerships@sodax.com"
                      className="inline-flex items-center gap-2 bg-white hover:bg-[var(--cream-white)] transition-colors text-[var(--espresso)] font-['InterMedium'] text-sm px-5 py-2.5 rounded-full border border-[var(--cherry-grey)]"
                    >
                      Contact Us
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* About Us Section */}
          <AnimatedScrollSection className="flex flex-col gap-4 items-start w-full max-w-2xl">
            <h2 className="font-['InterBold'] text-lg text-[var(--espresso)] w-full">About Us</h2>
            <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-relaxed">
              SODAX is an execution and liquidity system that enables DeFi actions across 14+ networks. This includes
              Solana, Sui, Stellar, Ethereum, Arbitrum, and Polygon. The system coordinates swaps, lending, and
              borrowing through a single layer powered by protocol-owned liquidity and intent-based execution.
            </p>
            <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] w-full leading-relaxed">
              <span className="font-['InterBold'] text-[var(--espresso)]">Trusted at scale.</span> Powering
              cross-network execution for Houdini Swap, Balanced, Hana Wallet, Amped Finance, and LightLink. Our solver
              network optimizes for capital efficiency and execution reliability, aggregating liquidity to deliver
              competitive pricing and predictable settlement times.
            </p>
          </AnimatedScrollSection>

          <div className="w-full max-w-2xl h-px bg-[var(--cream-white)]" />

          {/* The Solution Section */}
          <AnimatedScrollSection className="flex flex-col gap-4 items-start w-full">
            <h2 className="font-['InterBold'] text-lg text-[var(--espresso)] w-full">The Solution</h2>
            <p className="font-['InterRegular'] text-base text-[var(--clay-dark)] w-full leading-relaxed">
              <span className="font-['InterBold']">SODAX zeroes in on capital efficiency.</span> We combine an
              intent-based solver network with protocol-supported liquidity, enabling applications to execute swaps,
              lending, and stablecoin operations through a single SDK.
            </p>

            {/* Feature Cards */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch w-full">
              <FeatureCard
                title="Solver Network Coordination"
                description="Solvers coordinate execution across networks by aggregating liquidity from leading DEXs such as Uniswap, PancakeSwap, and Raydium. Routing is MEV-aware with fixed 0.1% protocol fees and predictable execution behavior."
              />
              <FeatureCard
                title="Protocol-Owned Liquidity"
                description="Deep, deployed capital fuels cross-network swaps, multi-network lending, and bnUSD minting. This supports execution from day one and reduces reliance on bootstrap pools."
              />
              <FeatureCard
                title="Network-Agnostic Money Market"
                description="Single-asset lending with collateralized borrowing across all supported networks. Abstracted wallet logic means users can execute actions without manually switching networks or managing bridge interactions."
              />
            </div>
          </AnimatedScrollSection>

          {/* Ideal For Section */}
          <AnimatedScrollSection className="bg-[var(--cream-white)] -mx-4 md:-mx-8 px-6 md:px-20 pb-16 pt-12 mb-16 rounded-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col justify-end w-52">
                <h2 className="font-['InterBlack'] text-5xl md:text-6xl text-[var(--espresso)] text-right leading-none">
                  IDEAL
                  <br />
                  FOR
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1">
                <IdealForCard title="DEXs" description="Deeper liquidity and a simplified user experience" />
                <IdealForCard title="L1/L2 Networks" description="Faster access to assets from major ecosystems" />
                <IdealForCard title="Crypto Wallets" description="Cross-network swaps with minimal user friction" />
                <IdealForCard title="TGE Projects" description="Launch tokens across networks" />
                <div className="col-span-2">
                  <IdealForCard
                    title="Money Markets and Lending Services"
                    description="Get multi-network expansion without infrastructure overhead"
                  />
                </div>
              </div>
            </div>
          </AnimatedScrollSection>

          <AnimatedScrollSection className="flex flex-col gap-4 items-start mb-16">
            <h2 className="font-['InterBlack'] text-5xl md:text-6xl text-[var(--espresso)] leading-none">
              OUR
              <br />
              PRODUCTS
            </h2>
            <div className="font-['InterRegular'] text-base text-[var(--clay-dark)] leading-relaxed max-w-2xl">
              <p className="mb-3">
                SODAX is built as a layered SDK stack. Builders can integrate at different levels depending on how much
                control or abstraction they want.
              </p>
              <p>All layers provide access to SODAX-coordinated execution and protocol-supported liquidity.</p>
            </div>

            {/* Core SDK */}
            <div className="border-t-2 border-[var(--cream-white)] flex flex-col gap-2 items-start pt-4 pr-4 w-full">
              <div className="flex gap-2 items-center">
                <p className="font-['InterBold'] text-lg text-[var(--espresso)]">Core SDK</p>
                <p className="font-['InterRegular'] text-lg text-[var(--clay)]">Foundation layer</p>
              </div>
              <p className="font-['InterRegular'] text-base text-[var(--clay-dark)] leading-relaxed">
                The foundation of the SODAX stack. Cross-network execution via an intent-based solver, money market
                integration, bnUSD minting access, and coverage across 14+ supported networks. Designed for teams
                building custom logic with maximum control.
              </p>
            </div>

            {/* dAppKit and Wallet SDK */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="border-t-2 border-[var(--cream-white)] flex flex-col gap-2 items-start pt-4 pr-4 flex-1">
                <div className="flex gap-2 items-center">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">dAppKit</p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay)]">Experience layer</p>
                </div>
                <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                  For rapid launches. Opinionated React components for swaps, lending, borrowing, and wallet
                  connectivity. Built on top of the Core SDK and Wallet SDK, allowing teams to customize or launch with
                  a reference interface.
                </p>
              </div>
              <div className="border-t-2 border-[var(--cream-white)] flex flex-col gap-2 items-start pt-4 pr-4 flex-1">
                <div className="flex gap-2 items-center">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)]">Wallet SDK</p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay)]">Connection layer</p>
                </div>
                <p className="font-['InterRegular'] text-sm text-[var(--espresso)] leading-relaxed">
                  For app builders. Optional multi-network wallet connectivity with prebuilt connection logic and native
                  wallet flows for EVM and non-EVM networks. Use standalone or pair with the Core SDK.
                </p>
              </div>
            </div>
          </AnimatedScrollSection>
          <AnimatedScrollSection className="bg-[var(--cream-white)] -mx-4 md:-mx-8 px-6 md:px-20 pb-20 pt-12 mb-16 relative overflow-hidden rounded-2xl">
            {/* App Mockup - positioned on right */}
            <div className="absolute right-4 md:right-12 top-8 w-[280px] md:w-[350px] h-[400px] hidden lg:block">
              <Image src={imgAppMockup} alt="SODAX App Preview" fill className="object-contain" />
            </div>

            <div className="flex flex-col gap-4 items-start max-w-md relative z-10">
              <h2 className="font-['InterBlack'] text-4xl text-[var(--espresso)] leading-none">PARTNERS</h2>
              <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                Our solver network aggregates liquidity from leading DEXs across major and emerging networks to support
                reliable cross-network execution.
              </p>

              {/* Live App Integrations */}
              <div className="flex flex-col gap-2 items-start w-full">
                <p className="font-['InterMedium'] text-xs text-[var(--clay)] uppercase tracking-wider">
                  Live App Integrations
                </p>
                <div className="flex flex-wrap gap-2 items-start">
                  <PartnerLogo description="Privacy DEX">
                    <Image src={imgLogoHoudini} alt="Houdini Swap" width={49} height={17} className="object-contain" />
                  </PartnerLogo>
                  <PartnerLogo description="Cross-network DEX">
                    <div className="flex items-center gap-1">
                      <Image src={imgLogoBalanced1} alt="Balanced" width={26} height={26} className="object-contain" />
                    </div>
                  </PartnerLogo>
                  <PartnerLogo description="Derivatives DEX">
                    <div className="flex items-center gap-1">
                      <Image src={imgLogoAmped1} alt="Amped" width={11} height={11} className="object-contain" />
                      <Image src={imgLogoAmped2} alt="Amped Finance" width={58} height={7} className="object-contain" />
                    </div>
                  </PartnerLogo>
                  <PartnerLogo description="Money app">
                    <Image src={imgLogoHana} alt="Hana Wallet" width={49} height={19} className="object-contain" />
                  </PartnerLogo>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="flex flex-col gap-2 items-start w-full">
                <p className="font-['InterMedium'] text-xs text-[var(--clay)] uppercase tracking-wider">Coming Soon</p>
                <div className="flex flex-wrap gap-2 items-start">
                  <PartnerLogo description="Yield vaults">
                    <div className="flex items-center gap-1">
                      <Image
                        src={imgLogoSommSymbol}
                        alt="Sommelier"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <Image src={imgLogoSommWord} alt="Sommelier" width={29} height={11} className="object-contain" />
                    </div>
                  </PartnerLogo>
                  <PartnerLogo description="Perps aggregator">
                    <Image
                      src={imgLogoSuperposition}
                      alt="Superposition"
                      width={67}
                      height={26}
                      className="object-contain"
                    />
                  </PartnerLogo>
                  <PartnerLogo description="Native Bitcoin DEX">
                    <Image src={imgLogoRadfi} alt="RadFi" width={45} height={26} className="object-contain" />
                  </PartnerLogo>
                  <PartnerLogo description="Intent-based swaps">
                    <Image src={imgLogo1inch} alt="1inch" width={40} height={10} className="object-contain" />
                  </PartnerLogo>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-[var(--almost-white)] flex flex-wrap gap-4 md:gap-8 items-center px-6 md:px-8 py-6 rounded-2xl mt-12">
              <h3 className="font-['InterBlack'] text-xl text-[var(--espresso)] leading-none">
                KEY
                <br />
                METRICS
              </h3>
              <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                <StatItem value="14+" label="Networks Supported" />
                <StatItem value="< 30 sec" label="Cross-Network Swaps" />
                <StatItem value="~200 ms" label="Transaction Finality" />
                <StatItem value="1 week" label="to Integration" />
              </div>
            </div>

            {/* Networks */}
            <div className="flex flex-col md:flex-row gap-6 items-start mt-6">
              <div className="flex flex-col gap-2 items-start flex-1">
                <p className="font-['InterMedium'] text-xs text-[var(--clay)] uppercase tracking-wider">
                  Network Integrations
                </p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Sonic, Sui, Base, Ethereum, Arbitrum, Polygon & Polygon zkEVM, Avalanche, BNB Chain, Optimism,
                  Injective, Stellar, HyperEVM, ICON, LightLink
                </p>
              </div>
              <div className="flex flex-col gap-2 items-start flex-1">
                <p className="font-['InterMedium'] text-xs text-[var(--clay)] uppercase tracking-wider">Coming Soon</p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Bitcoin, NEAR, Redbelly, Stacks, Aleo, Giwa, Kaia
                </p>
              </div>
            </div>
          </AnimatedScrollSection>
          <AnimatedScrollSection className="bg-gradient-to-b from-[var(--cream-white)] to-[var(--almost-white)] -mx-4 md:-mx-8 px-6 md:px-20 py-12 mb-0">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Laptop Image */}
              <div className="relative w-full lg:w-[500px] h-[300px] lg:h-[400px] shrink-0">
                <Image src={imgLaptopMockup} alt="SODAX Powered Application" fill className="object-contain" />
              </div>
              {/* Powered by SODAX Text */}
              <div className="flex flex-col gap-2 items-start max-w-xs">
                <p className="font-['InterBold'] text-sm text-[var(--espresso)]">Powered by SODAX</p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Partners and users benefit from coordinated execution across 50+ liquidity sources and
                  network-dependent finality.
                </p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Houdini Swap integrated the SODAX SDK to support competitive cross-network execution across EVM
                  networks, Solana, and Sui.
                </p>
              </div>
            </div>
          </AnimatedScrollSection>

          <AnimatedScrollSection className="flex flex-col gap-6 items-start py-16 px-6 md:px-20 -mx-4 md:-mx-8 bg-[var(--almost-white)]">
            <h2 className="font-['InterBlack'] text-5xl md:text-6xl text-[var(--espresso)] leading-none">WHY SODAX</h2>

            {/* Comparison Cards */}
            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
              <div className="flex-1 flex flex-col items-start">
                <p className="font-['InterBold'] text-sm text-[var(--espresso)] h-5 leading-tight">
                  vs. Building Yourself
                </p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Avoid months of cross-network infrastructure work. SODAX handles execution coordination, liquidity
                  access, and recovery-aware flows so teams don't have to build them from scratch.
                </p>
              </div>
              <div className="flex-1 flex flex-col items-start">
                <p className="font-['InterBold'] text-sm text-[var(--espresso)] h-5 leading-tight">
                  vs. LayerZero/Axelar
                </p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  SODAX complements messaging infrastructure. While messaging layers move data or assets between
                  networks, SODAX coordinates execution and liquidity on top to help applications deliver usable
                  outcomes.
                </p>
              </div>
              <div className="flex-1 flex flex-col items-start">
                <p className="font-['InterBold'] text-sm text-[var(--espresso)] h-5 leading-tight">
                  vs. Traditional Bridges
                </p>
                <p className="font-['InterRegular'] text-xs text-[var(--clay-dark)] leading-relaxed">
                  Bridges move assets. SODAX coordinates outcomes. Traditional bridges stop at transfer, leaving
                  execution, liquidity, and recovery to the application.
                </p>
              </div>
            </div>
          </AnimatedScrollSection>
          <AnimatedScrollSection className="bg-[var(--cream-white)] -mx-4 md:-mx-8 px-6 md:px-20 py-10 mb-16 rounded-2xl">
            <div className="flex flex-col gap-2 items-start w-full">
              <h2 className="font-['InterBold'] text-lg text-[var(--espresso)] leading-tight">Who We Are</h2>
              <div className="flex flex-col md:flex-row gap-4 items-start w-full">
                {/* Left Column */}
                <div className="flex-1">
                  <div className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                    <p className="mb-2">
                      <span className="font-['InterBold']">Built by the ICON Foundation.</span> A nonprofit organization
                      based in Switzerland and regulated by Swiss authorities, ICON has worked on cross-network
                      technology since 2017. In 2025, ICON shifted focus from operating an independent blockchain to
                      directly addressing DeFi execution challenges through coordinated execution, protocol-supported
                      liquidity, and network-agnostic UX.
                    </p>
                    <p>
                      The result is SODAX, an intent-based execution stack for swaps and money markets, with
                      protocol-supported liquidity and compatibility with major bridging and messaging infrastructure
                      including LayerZero, Axelar, IBC, and Wormhole.
                    </p>
                  </div>
                </div>

                {/* Right Column - Tokenomics */}
                <div className="border-l-2 border-[var(--cherry-grey)] flex-1 flex flex-col gap-2 items-start pl-4">
                  <div className="flex gap-2 items-center">
                    <div className="bg-[var(--cherry-soda)] overflow-hidden rounded-full w-4 h-4 flex items-center justify-center">
                      <Image src={imgSodaToken} alt="SODA" width={11} height={11} className="object-contain" />
                    </div>
                    <p className="font-['InterBold'] text-sm text-[var(--espresso)]">SODA Tokenomics</p>
                  </div>
                  <div className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                    <p className="mb-1">SODA is a governance token with yield from staking and protocol fees.</p>
                    <p>SDK partners configure fees in any token—no SODA required for integration.</p>
                  </div>
                  <ul className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed list-disc ml-4 space-y-1">
                    <li>
                      <span className="font-['InterBold']">Total Supply:</span> 1.5 billion tokens (capped)
                    </li>
                    <li>
                      <span className="font-['InterBold']">Circulating Supply:</span> 1.08 billion tokens
                    </li>
                    <li>
                      <span className="font-['InterBold']">CEX Migration:</span> Ongoing migration from ICX, with 20+
                      exchanges supporting SODA including Upbit, Kraken and Binance.com
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reference and Deep Dive Cards */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch mt-6">
              {/* Reference Links */}
              <div className="bg-[var(--almost-white)] flex flex-col gap-2 items-start px-8 py-6 rounded-2xl w-full md:w-52">
                <p className="font-['InterBold'] text-sm text-[var(--espresso)] leading-snug">Reference links</p>
                <ul className="font-['InterRegular'] text-xs text-[var(--clay-dark)] list-disc ml-4 space-y-1">
                  <li>
                    Social media:{' '}
                    <a
                      href="https://x.com/gosodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--espresso)]"
                    >
                      X
                    </a>{' '}
                    |{' '}
                    <a
                      href="https://www.linkedin.com/company/107209352/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--espresso)]"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.sodax.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--espresso)]"
                    >
                      Website
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.coingecko.com/en/coins/sodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--espresso)]"
                    >
                      SODA on Coingecko
                    </a>
                  </li>
                </ul>
              </div>

              {/* Technical Deep Dive */}
              <div className="bg-[var(--almost-white)] flex flex-col gap-4 items-start px-8 py-6 rounded-2xl flex-1">
                <div className="flex flex-col gap-1 items-start w-full">
                  <p className="font-['InterBold'] text-sm text-[var(--espresso)] leading-relaxed">
                    Technical Deep Dive
                  </p>
                  <p className="font-['InterRegular'] text-sm text-[var(--clay-dark)] leading-relaxed">
                    Visit{' '}
                    <a
                      href="https://docs.sodax.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-['InterBold'] underline hover:text-[var(--espresso)]"
                    >
                      docs.sodax.com
                    </a>{' '}
                    or contact our team for specific inquiries.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <TeamMember
                    name="Fez Mubaraki"
                    jobTitle="Head of Product & Technology"
                    email="fez@sodax.com"
                    imageSrc={imgFez}
                  />
                  <TeamMember name="Anton Andell" jobTitle="Tech Lead" email="anton@sodax.com" imageSrc={imgAnton} />
                </div>
              </div>
            </div>
          </AnimatedScrollSection>
          <AnimatedScrollSection className="flex flex-col gap-6 items-center px-6 md:px-20 pb-24 pt-8">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-end w-full">
              <h2 className="font-['InterBlack'] text-2xl text-[var(--espresso)] text-right leading-tight">
                READY TO GO
                <br />
                CROSS-NETWORK?
              </h2>
              <TeamMember name="Min Kim" jobTitle="Founder & President" imageSrc={imgMinKim} size="large" />
              <TeamMember name="Arosh Ediriweera" jobTitle="Partnerships Manager" imageSrc={imgArosh} size="large" />
            </div>
            <div className="flex gap-4 items-center mt-4">
              <a
                href="https://docs.sodax.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--cherry-soda)] hover:bg-[var(--espresso)] transition-colors text-white font-['InterMedium'] text-sm px-6 py-3 rounded-full"
              >
                Explore Documentation
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="mailto:partnerships@sodax.com"
                className="inline-flex items-center gap-2 bg-[var(--almost-white)] hover:bg-[var(--cream-white)] transition-colors text-[var(--espresso)] font-['InterMedium'] text-sm px-6 py-3 rounded-full border border-[var(--cherry-grey)]"
              >
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </AnimatedScrollSection>
        </div>
      </div>

      <PartnerSimpleFooter />
    </div>
  );
}
