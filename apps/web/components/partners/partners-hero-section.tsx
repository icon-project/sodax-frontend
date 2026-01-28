'use client';

import { Button } from '@/components/ui/button';
import { ArrowRightIcon, FileTextIcon } from '@phosphor-icons/react/dist/ssr';

export default function PartnersHeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center bg-cherry-soda overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(var(--cream) 1px, transparent 1px),
                           linear-gradient(90deg, var(--cream) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Elements - Subtle Animation */}
      <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-yellow-soda/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-cream/10 blur-3xl animate-pulse delay-1000" />

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
        <div className="mb-4 inline-block">
          <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-cream text-sm font-['InterMedium'] tracking-wide">
            PREFERRED PARTNER NETWORK
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-white mb-4 leading-tight">
          Coordinate Execution.
          <br />
          <span className="font-['Shrikhand'] lowercase text-yellow-soda">deliver</span> Outcomes.
        </h1>

        <p className="text-base md:text-lg text-cream/90 font-['InterRegular'] max-w-2xl mx-auto mb-8 leading-relaxed">
          Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure.
          Access unified liquidity and intent-based execution across 14+ networks.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            className="bg-white text-cherry-soda hover:bg-cream font-['InterBold'] px-6 py-3 group"
            onClick={() => {
              window.location.href = 'mailto:partnerships@sodax.com?subject=Partnership Inquiry';
            }}
          >
            Become a Partner
            <ArrowRightIcon weight="duotone" className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-['InterMedium'] px-6 py-3"
            onClick={() => window.open('https://docs.sodax.com', '_blank')}
          >
            <FileTextIcon weight="duotone" className="mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-cream text-xs font-['InterMedium'] tracking-wider">EXPLORE</span>
        <div className="w-6 h-10 border-2 border-cream rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-cream rounded-full" />
        </div>
      </div>
    </section>
  );
}
