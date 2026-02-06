'use client';

import { PackageOpen, Settings2, Users } from 'lucide-react';

export default function PartnersHeroSection() {
  return (
    <section
      className="relative flex flex-col items-center bg-cherry-soda overflow-hidden pt-63.25 pb-30"
      aria-label="Partner Network Hero"
    >
      {/* Main Content */}
      <div className="flex flex-col gap-8 items-center text-center max-w-140 mx-auto px-6">
        <p className="font-['InterRegular'] text-[18px] leading-[1.2] text-cherry-brighter">
          Preferred Partner Network
        </p>

        <h1 className="font-['InterExtraBold'] text-[32px] md:text-[42px] leading-[1.1] text-white text-center">
          Build cross-network applications.{' '}
          <span className="text-yellow-soda">
            Skip the
            <br className="hidden md:block" /> infrastructure.
          </span>
        </h1>

        <p className="font-['InterRegular'] text-[18px] leading-[1.2] text-white max-w-132">
          SODAX coordinates execution and liquidity across 14+ networks so you can deliver intended outcomes without
          owning cross-network infrastructure.
        </p>

        <div className="flex gap-4 items-center justify-center">
          <button
            type="button"
            className="bg-white hover:bg-cream text-espresso font-['InterMedium'] text-[14px] leading-[1.4] h-10 px-6 py-2 rounded-[240px] text-center transition-colors"
            onClick={() => {
              window.location.href = 'mailto:partnerships@sodax.com?subject=Partnership Inquiry';
            }}
          >
            Become a partner
          </button>
          <button
            type="button"
            className="bg-transparent border-3 border-cherry-bright text-cream font-['InterRegular'] text-[14px] leading-[1.4] h-10 px-6 py-2 rounded-[240px] text-center transition-colors"
            onClick={() => window.open('https://docs.sodax.com', '_blank')}
          >
            Documentation
          </button>
        </div>
      </div>

      {/* Jump to Section */}
      <div className="flex flex-col gap-4 items-center mt-auto pt-24">
        {/* Divider */}
        <div>
          <div className="w-136 max-w-[90vw] h-0.5 bg-cherry-brighter/20" />
          <div className="w-136 max-w-[90vw] h-0.5 bg-cherry-dark/20" />
        </div>

        <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-cherry-brighter">Jump to</p>

        <div className="flex gap-6 items-center">
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors"
            onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Case studies
            <Users size={16} className="text-cherry-bright" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors"
            onClick={() => document.getElementById('sodax-advantages')?.scrollIntoView({ behavior: 'smooth' })}
          >
            SODAX Advantages
            <PackageOpen size={16} className="text-cherry-bright" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors"
            onClick={() => document.getElementById('integration-options')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Integration Options
            <Settings2 size={16} className="text-cherry-bright" />
          </button>
        </div>
      </div>
    </section>
  );
}
