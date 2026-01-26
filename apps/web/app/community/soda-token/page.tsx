'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Lock, 
  Network, 
  TrendingDown, 
  Users, 
  Coins,
  Shield,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Footer from '@/components/landing/footer';
import { MarketingHeader } from '@/components/shared/marketing-header';

// API fetcher with proper error handling
async function fetchSupplyData(endpoint: string): Promise<number> {
  const response = await fetch(`https://api.sodax.com/v1/be/sodax/${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }

  const text = await response.text();
  const value = Number.parseFloat(text);

  if (Number.isNaN(value)) {
    throw new Error(`Invalid data received from ${endpoint}`);
  }

  return value;
}

// Custom hooks for data fetching with React Query
function useCirculatingSupply() {
  return useQuery({
    queryKey: ['soda-token', 'circulating-supply'],
    queryFn: () => fetchSupplyData('circulating_supply'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

function useTotalSupply() {
  return useQuery({
    queryKey: ['soda-token', 'total-supply'],
    queryFn: () => fetchSupplyData('total_supply'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Format large numbers with commas
function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}

// Animated counter component
function AnimatedValue({ value, className }: { value: string; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

// Section container with animation
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Expandable FAQ itemm
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-cherry-grey/20 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 sm:py-3 px-3 sm:px-4 flex items-start justify-between gap-3 sm:gap-4 text-left hover:bg-cream/20 transition-colors"
      >
        <span className="text-espresso text-sm font-medium font-['InterRegular'] flex-1">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-clay flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 text-clay text-sm font-['InterRegular'] leading-relaxed">
            {answer}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Copy to clipboard button
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 hover:bg-clay/10 rounded transition-colors"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-clay" />
      )}
    </button>
  );
}

export default function SodaTokenPage() {
  const circulatingQuery = useCirculatingSupply();
  const totalQuery = useTotalSupply();

  const isLoading = circulatingQuery.isLoading || totalQuery.isLoading;
  const hasError = circulatingQuery.isError || totalQuery.isError;

  const networks = [
    { name: 'Sonic', address: '0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963', role: 'Main Token' },
    { name: 'Ethereum', address: '0x12affee59ceb8be6788a25f9b36149a717795a51', role: 'Spoke' },
    { name: 'Avalanche', address: '0xf51d7082375cdca8c19c74e1a0c77da482afda4e', role: 'Spoke' },
    { name: 'Base', address: '0x17ff8ad5ebe6ca8b15751067cd0c89f0e580cd17', role: 'Spoke' },
    { name: 'Optimism', address: '0x0ed0d274dc77ef460dc96b9fbaff3edb074e0471', role: 'Spoke' },
    { name: 'Arbitrum', address: '0x93a367e5b37a1b9e8d04ef25a6af40d181a3dfff', role: 'Spoke' },
  ];

  const faqs = [
    {
      question: 'What is the total supply of SODA?',
      answer: 'The total supply is fixed at 1.5 billion tokens. No more can be minted.',
    },
    {
      question: 'What is the vesting schedule for locked supply?',
      answer: 'Locked SODA follows a 5-year vesting schedule with a 1-year cliff. This ensures long-term alignment and gradual token distribution.',
    },
    {
      question: 'How is SODA deflationary?',
      answer: '20% of protocol revenue is used to buy SODA from the market and burn it permanently, linking supply reduction to system usage.',
    },
    {
      question: 'What is Protocol-Owned Liquidity (POL)?',
      answer: 'Protocol-managed liquidity that supports execution reliability and solver inventory across networks.',
    },
    {
      question: 'How do I earn staking rewards?',
      answer: 'By staking SODA for xSODA. You receive 20% of protocol revenue, with higher APR for longer locks (up to 180 days).',
    },
    {
      question: 'Can I unstake early?',
      answer: 'Yes, but a penalty is applied and redistributed to other stakers who remain committed.',
    },
    {
      question: 'What networks are supported?',
      answer: '16+ networks including Sonic, Ethereum, Arbitrum, Avalanche, Solana, Sui, Stellar, and more.',
    },
  ];

  return (
    <div className="min-h-screen bg-almost-white w-full">
      {/* Header */}
      <MarketingHeader />
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-['InterRegular'] text-espresso">
            SODA Token
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-clay font-['InterRegular'] leading-relaxed">
            Participation and coordination inside the SODAX execution system
          </p>
        </motion.div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-12">
            {[1, 2].map(i => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-2 border-cherry-grey/20 p-6 sm:p-8 lg:p-10 shadow-xl animate-pulse"
              >
                <div className="h-5 sm:h-6 bg-clay/20 rounded w-1/2 mb-4 sm:mb-6" />
                <div className="h-12 sm:h-16 bg-clay/20 rounded w-3/4 mb-3 sm:mb-4" />
                <div className="h-3 sm:h-4 bg-clay/20 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm font-['InterRegular']">
              Failed to load token data. Please try again later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Circulating Supply */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-cream-white border border-cherry-grey/20 hover:border-clay/30 rounded-lg p-3 sm:p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-clay text-xs sm:text-xs font-medium font-['InterRegular'] uppercase tracking-wide">
                    Circulating Supply
                  </div>
                  <div className="w-2 h-2 rounded-full bg-espresso animate-pulse" />
                </div>
                <AnimatedValue
                  value={formatNumber(circulatingQuery.data)}
                  className="text-2xl sm:text-3xl font-bold font-['InterRegular'] text-espresso block mb-1"
                />
                <p className="text-clay text-sm font-['InterRegular']">
                  SODA in circulation
                </p>
              </motion.div>

              {/* Total Supply */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-cream-white border border-cherry-grey/20 hover:border-clay/30 rounded-lg p-3 sm:p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-clay text-xs sm:text-xs font-medium font-['InterRegular'] uppercase tracking-wide">
                    Total Supply
                  </div>
                  <div className="w-2 h-2 rounded-full bg-espresso" />
                </div>
                <AnimatedValue
                  value={formatNumber(totalQuery.data)}
                  className="text-2xl sm:text-3xl font-bold font-['InterRegular'] text-espresso block mb-1"
                />
                <p className="text-clay text-sm font-['InterRegular']">
                  Fixed maximum
                </p>
              </motion.div>
            </div>

            {/* Official Contract */}
            <div className="bg-gradient-to-r from-yellow-dark/10 to-cherry-dark/10 border-l-4 border-yellow-dark rounded-lg p-3 sm:p-4 mb-8">
              <div className="flex items-start gap-2 sm:gap-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-dark flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-espresso text-xs sm:text-sm font-bold font-['InterRegular'] mb-2">
                    Official SODA Token Contract (Sonic)
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 sm:flex-wrap">
                    <code className="text-clay text-xs font-mono bg-cream-white px-2 py-1 rounded break-all">
                      0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963
                    </code>
                    <CopyButton text="0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963" />
                    <a
                      href="https://sonicscan.org/token/0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-yellow-dark hover:text-cherry-dark font-medium transition-colors"
                    >
                      View on SonicScan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* TL;DR Section */}
        <Section delay={0}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-espresso mb-3 sm:mb-4">
              Key Points
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <Lock className="w-4 h-4 text-clay flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-espresso text-sm font-bold font-['InterRegular'] mb-1">
                    Protocol Participation Token
                  </div>
                  <p className="text-clay text-sm font-['InterRegular'] leading-relaxed">
                    SODA aligns liquidity participation, execution incentives, and protocol governance across the
                    SODAX network.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Flame className="w-4 h-4 text-clay flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-espresso text-sm font-bold font-['InterRegular'] mb-1">
                    Fixed Supply with Protocol-Driven Burns
                  </div>
                  <p className="text-clay text-sm font-['InterRegular'] leading-relaxed">
                    SODA has a hard cap of 1.5 billion tokens. Protocol revenue is used to market-buy and permanently
                    burn SODA, linking supply reduction to system usage.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Network className="w-4 h-4 text-clay flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-espresso text-sm font-bold font-['InterRegular'] mb-1">
                    Execution-Native by Design
                  </div>
                  <p className="text-clay text-sm font-['InterRegular'] leading-relaxed">
                    SODA underpins how liquidity, solvers, and governance interact inside SODAX's hub-and-spoke
                    architecture, supporting predictable cross-network execution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* What is SODA */}
        <Section delay={0}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-espresso mb-3">
              What is SODA?
            </h2>
            <p className="text-clay text-sm font-['InterRegular'] leading-relaxed mb-3">
              SODA is the native utility and governance token of the SODAX execution coordination system. SODAX is
              built as an outcome-oriented cross-network execution system that coordinates liquidity and execution
              across heterogeneous networks.
            </p>
            <p className="text-clay text-sm font-['InterRegular'] leading-relaxed">
              SODA provides the economic layer that aligns solver incentives with execution reliability, enables
              participation in protocol-managed liquidity, and governs how the system evolves - supporting execution
              coordination under real-world asynchronous conditions.
            </p>
          </div>
        </Section>

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* Token Economics */}
        <Section delay={0}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-espresso mb-3">
              Token Economics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-cherry-grey/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-clay" />
                  <div className="text-espresso text-sm font-bold font-['InterRegular']">
                    20% Protocol Burn
                  </div>
                </div>
                <p className="text-clay text-xs font-['InterRegular'] leading-relaxed">
                  Revenue used to market-buy SODA, then permanently removed from circulation
                </p>
              </div>
              <div className="border border-cherry-grey/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-clay" />
                  <div className="text-espresso text-sm font-bold font-['InterRegular']">
                    50% POL Reinvestment
                  </div>
                </div>
                <p className="text-clay text-xs font-['InterRegular'] leading-relaxed">
                  Reinvested into protocol-managed liquidity to support execution reliability and solver inventory
                </p>
              </div>
              <div className="border border-cherry-grey/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-clay" />
                  <div className="text-espresso text-sm font-bold font-['InterRegular']">
                    20% Staking Rewards
                  </div>
                </div>
                <p className="text-clay text-xs font-['InterRegular'] leading-relaxed">
                  Distributed to xSODA holders to reward long-term participation
                </p>
              </div>
              <div className="border border-cherry-grey/20 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-clay" />
                  <div className="text-espresso text-sm font-bold font-['InterRegular']">
                    10% DAO / Incentives
                  </div>
                </div>
                <p className="text-clay text-xs font-['InterRegular'] leading-relaxed">
                  Allocated for ecosystem expansion and strategic partnerships
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* Network Deployments */}
        <Section delay={0}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-espresso mb-3">
              Network Deployments
            </h2>
            <p className="text-clay text-sm font-['InterRegular'] leading-relaxed mb-3">
              SODA is natively deployed across multiple networks:
            </p>
            <div className="space-y-2">
              {networks.map((network, index) => (
                <div
                  key={index}
                  className="border border-cherry-grey/20 hover:border-clay/30 rounded p-2.5 sm:p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-espresso text-sm font-bold font-['InterRegular']">
                        {network.name}
                      </div>
                      <p className="text-clay text-xs font-['InterRegular']">{network.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-clay text-xs font-mono bg-cream-white px-2 py-1 rounded truncate max-w-[140px]">
                        {network.address.slice(0, 6)}...{network.address.slice(-4)}
                      </code>
                      <CopyButton text={network.address} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* FAQ Section */}
        <Section delay={0}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-espresso mb-3 sm:mb-4">
              FAQ
            </h2>
            <div className="divide-y divide-cherry-grey/20">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </Section>

        {/* Divider */}
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30 mb-8" />

        {/* CTA Section */}
        <Section delay={0}>
          <div className="bg-espresso rounded-lg p-4 sm:p-5 text-center">
            <h2 className="text-lg sm:text-xl font-bold font-['InterRegular'] text-white mb-2">
              Ready to get started?
            </h2>
            <p className="text-white/80 text-sm font-['InterRegular'] mb-4">
              Explore the SODAX ecosystem and start using SODA today
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <Link
                href="/swap"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-espresso px-5 py-2.5 rounded-lg font-['InterRegular'] font-medium text-sm hover:bg-almost-white transition-colors"
              >
                Launch App
                <ExternalLink className="w-4 h-4" />
              </Link>
              <a
                href="https://docs.sodax.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/30 text-white px-5 py-2.5 rounded-lg font-['InterRegular'] font-medium text-sm hover:bg-white/10 transition-colors"
              >
                Read Docs
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Section>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
