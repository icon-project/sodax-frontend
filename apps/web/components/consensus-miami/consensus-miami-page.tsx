'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { NETWORK_ICON_MAP } from '@/components/network-icons';
import { DISCORD_ROUTE, DOCUMENTATION_ROUTE, HOME_ROUTE, X_ROUTE } from '@/constants/routes';
import { ProjectFlow } from './project-flow';
import { RetailFlow } from './retail-flow';

type Flow = 'none' | 'project' | 'retail';

const NETWORKS = [
  'Ethereum',
  'Sonic',
  'Arbitrum',
  'Base',
  'Optimism',
  'Avalanche',
  'Polygon',
  'Solana',
  'Sui',
  'Stellar',
  'ICON',
  'Bitcoin',
  'BNB Chain',
  'HyperEVM',
  'Near',
  'Kaia',
  'LightLink',
];

export function ConsensusMiamiPage() {
  const [flow, setFlow] = useState<Flow>('none');

  return (
    <div className="min-h-dvh w-screen bg-cherry-soda text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 max-w-2xl mx-auto w-full">
        <Link href={HOME_ROUTE} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/symbol.png" alt="SODAX" width={28} height={28} />
          <SodaxIcon width={72} height={16} fill="white" />
        </Link>
        <Image src="/consensus.png" alt="Consensus Miami 2026" width={80} height={80} className="invert opacity-40" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:px-10">
        <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
          {/* Hero — always visible */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="font-[Shrikhand] text-3xl sm:text-4xl leading-tight text-white">
              Infrastructure for <span className="text-yellow-dark">modern money</span>
            </h1>
            <p className="text-cherry-brighter text-sm font-[InterRegular] leading-relaxed">
              Meet us at Consensus Miami · May 5–7, 2026
            </p>
          </div>

          {/* Fork buttons — shown when no flow selected */}
          {flow === 'none' && (
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => setFlow('project')}
                className="w-full h-14 rounded-2xl bg-yellow-dark hover:bg-yellow-soda text-cherry-dark font-[InterBold] text-base transition-all hover:scale-[1.02] cursor-pointer"
              >
                I&apos;m building a project
              </button>
              <button
                type="button"
                onClick={() => setFlow('retail')}
                className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-[InterBold] text-base border border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                I&apos;m exploring DeFi
              </button>
            </div>
          )}

          {/* Flow A — Projects */}
          {flow === 'project' && <ProjectFlow onBack={() => setFlow('none')} />}

          {/* Flow B — Retail */}
          {flow === 'retail' && <RetailFlow onBack={() => setFlow('none')} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 sm:px-10 flex flex-col items-center gap-6 max-w-2xl mx-auto w-full">
        {/* Network icons */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-cherry-brighter text-xs font-[InterRegular]">17+ networks</p>
          <div className="flex flex-wrap justify-center gap-3">
            {NETWORKS.map(name => {
              const Icon = NETWORK_ICON_MAP[name];
              if (!Icon) return null;
              return <Icon key={name} width={20} height={20} className="text-white opacity-40" aria-label={name} />;
            })}
          </div>
        </div>

        {/* Links */}
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
          <Image src="/symbol.png" alt="SODAX" width={16} height={16} className="opacity-40" />
          <span className="text-cherry-bright/40 text-xs font-[InterRegular]">© 2026 ICON Foundation</span>
        </div>
      </footer>
    </div>
  );
}
