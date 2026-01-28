'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, GithubLogo, ChatCircle } from '@phosphor-icons/react/dist/ssr';

export default function PartnersCtaSection() {
  return (
    <section className="py-20 px-8 bg-cream">
      <div className="max-w-5xl mx-auto">
        {/* Main CTA */}
        <div className="bg-gradient-to-br from-cherry-soda to-cherry-bright rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-['InterBold'] text-white mb-6 leading-tight">
              Build <span className="font-['Shrikhand'] lowercase text-yellow-soda">faster</span>
              <br />
              without becoming a<br className="hidden md:block" /> cross-network infrastructure team.
            </h2>

            <p className="text-xl md:text-2xl text-cream/90 font-['InterRegular'] mb-10 max-w-3xl mx-auto">
              Join wallets, DEXs, and protocols integrating SODAX to abstract away execution complexity.
            </p>

            <Button
              size="lg"
              className="bg-white text-cherry-soda hover:bg-cream font-['InterBold'] px-10 py-7 text-lg group shadow-2xl"
              onClick={() => {
                window.location.href = 'mailto:partnerships@sodax.com?subject=Partnership Inquiry';
              }}
            >
              Start the Conversation
              <ArrowRight weight="duotone" className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="mt-6 text-cream/70 text-sm font-['InterRegular']">
              Reach out to{' '}
              <a
                href="mailto:partnerships@sodax.com"
                className="text-yellow-soda hover:text-yellow-soda/80 font-['InterMedium'] underline"
              >
                partnerships@sodax.com
              </a>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <a
            href="https://docs.sodax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-almost-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-clay-light/20"
          >
            <div className="w-12 h-12 rounded-lg bg-cherry-soda/10 flex items-center justify-center mb-4 group-hover:bg-cherry-soda/20 transition-colors">
              <FileText weight="duotone" className="w-6 h-6 text-cherry-soda" />
            </div>
            <h3 className="font-['InterBold'] text-espresso text-lg mb-2">Documentation</h3>
            <p className="text-sm text-clay-dark font-['InterRegular'] mb-3">
              Comprehensive guides, API references, and integration tutorials.
            </p>
            <span className="text-sm font-['InterMedium'] text-cherry-soda group-hover:text-cherry-bright flex items-center">
              Explore Docs
              <ArrowRight weight="duotone" className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          <a
            href="https://github.com/sodax-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-almost-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-clay-light/20"
          >
            <div className="w-12 h-12 rounded-lg bg-clay/10 flex items-center justify-center mb-4 group-hover:bg-clay/20 transition-colors">
              <GithubLogo weight="duotone" className="w-6 h-6 text-clay" />
            </div>
            <h3 className="font-['InterBold'] text-espresso text-lg mb-2">GitHub</h3>
            <p className="text-sm text-clay-dark font-['InterRegular'] mb-3">
              Explore our open-source SDKs and example implementations.
            </p>
            <span className="text-sm font-['InterMedium'] text-clay group-hover:text-clay-dark flex items-center">
              View Repositories
              <ArrowRight weight="duotone" className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          <a
            href="https://discord.gg/xM2Nh4S6vN"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-almost-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-clay-light/20"
          >
            <div className="w-12 h-12 rounded-lg bg-yellow-soda/20 flex items-center justify-center mb-4 group-hover:bg-yellow-soda/30 transition-colors">
              <ChatCircle weight="duotone" className="w-6 h-6 text-clay-dark" />
            </div>
            <h3 className="font-['InterBold'] text-espresso text-lg mb-2">Discord Community</h3>
            <p className="text-sm text-clay-dark font-['InterRegular'] mb-3">
              Connect with other builders and get support from our team.
            </p>
            <span className="text-sm font-['InterMedium'] text-clay-dark group-hover:text-espresso flex items-center">
              Join Discord
              <ArrowRight weight="duotone" className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
