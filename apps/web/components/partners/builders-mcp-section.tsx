'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, BookOpen, Copy, Check } from 'lucide-react';

const tools = [
  {
    icon: Terminal,
    title: 'Core API data',
    description:
      'Access live data from the SODAX API including supported chains, swap tokens, transaction lookups, and trading volume.',
    badges: ['Chains', 'Tokens', 'Volume', 'Transactions'],
  },
  {
    icon: Cpu,
    title: 'DeFi & Token data',
    description:
      'Money market positions, lending assets, partner integrations, and SODA token supply, all queryable by your AI agent.',
    badges: ['Lending', 'Borrowing', 'Partners', 'Token supply'],
  },
  {
    icon: BookOpen,
    title: 'SDK documentation',
    description:
      'Auto-proxied from docs.sodax.com via GitBook. Updates automatically when docs change, always current.',
    badges: ['Auto-sync', 'Search', 'Guides', 'Examples'],
  },
];

const compatibleAgents = ['Claude', 'ChatGPT', 'Cursor', 'VS Code', 'Windsurf', 'Cline', 'Gemini', 'Goose', 'Roo Code'];

const MCP_URL = 'https://builders.sodax.com/mcp';

export default function BuildersMcpSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="builders-mcp"
      className="bg-cream-white overflow-clip px-4 md:px-8 py-30"
      aria-label="Builders MCP Server"
    >
      <div className="flex flex-col gap-12 items-center max-w-236 mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 items-center"
        >
          <div className="flex gap-2 items-center">
            <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
            <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Builders MCP</h2>
          </div>
          <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-espresso text-center max-w-140">
            Connect your AI coding assistant to live SODAX API data and SDK documentation with one simple configuration.
            Build with live data, not stale docs.
          </p>
        </motion.div>

        {/* Tool Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl flex flex-col gap-4 items-start justify-start pt-12 pb-6 px-6 w-full sm:w-76 sm:min-h-55"
              >
                {/* Card Title Row */}
                <div className="flex gap-2 items-center w-full">
                  <Icon className="w-4 h-4 shrink-0 text-espresso" />
                  <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso flex-1">{tool.title}</h3>
                </div>

                {/* Card Description */}
                <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark w-full">
                  {tool.description}
                </p>

                {/* Badges */}
                <div className="flex gap-1 items-start flex-wrap">
                  {tool.badges.map(badge => (
                    <span
                      key={badge}
                      className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* MCP Connection Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl flex flex-col md:flex-row gap-8 items-center w-full px-6 md:px-10 py-10"
        >
          {/* Left: Info */}
          <div className="flex flex-col gap-4 items-start flex-1 min-w-0">
            <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">One connection. All tools.</h3>
            <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">
              Paste this MCP server URL into your AI coding assistant and get instant access to SODAX API data plus SDK
              documentation that auto-updates from GitBook.
            </p>
            <div className="flex gap-1 items-start flex-wrap">
              {compatibleAgents.map(agent => (
                <span
                  key={agent}
                  className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Code Block */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-espresso rounded-2xl p-5 font-mono text-[13px] leading-[1.6] text-cream-white overflow-x-auto relative group">
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Copy MCP URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-yellow-soda" />
                ) : (
                  <Copy className="w-4 h-4 text-cream-white/60" />
                )}
              </button>
              <div className="text-clay">{'{'}</div>
              <div className="pl-4">
                <span className="text-yellow-soda">&quot;mcpServers&quot;</span>
                <span className="text-clay">: {'{'}</span>
              </div>
              <div className="pl-8">
                <span className="text-yellow-soda">&quot;sodax-builders&quot;</span>
                <span className="text-clay">: {'{'}</span>
              </div>
              <div className="pl-12">
                <span className="text-yellow-soda">&quot;url&quot;</span>
                <span className="text-clay">: </span>
                <button
                  type="button"
                  className="text-cherry-brighter cursor-pointer hover:underline"
                  onClick={handleCopy}
                >
                  &quot;{MCP_URL}&quot;
                </button>
              </div>
              <div className="pl-8">
                <span className="text-clay">{'}'}</span>
              </div>
              <div className="pl-4">
                <span className="text-clay">{'}'}</span>
              </div>
              <div className="text-clay">{'}'}</div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <a
            href="https://builders.sodax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cherry-bright flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-white text-center">
              Explore builders.sodax.com
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
