// API route: /api/roadmap/classify
// Takes a protocol name and uses Claude to pick the best partner category.
// Called only when keyword matching is not confident and Notion has no data.

import { NextResponse } from 'next/server';
import type { CategoryId } from '@/components/partners/integration-roadmap/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const CATEGORIES: { id: CategoryId; description: string }[] = [
  { id: 'wallets', description: 'Crypto wallets — browser extensions, mobile apps, hardware wallets, MPC wallets' },
  {
    id: 'dexs',
    description: 'DEXs, swap aggregators, trading platforms, CEXs, payment rails, stablecoins, on/off ramps',
  },
  { id: 'lending', description: 'Lending & borrowing protocols, money markets, collateral platforms, CDP stablecoins' },
  {
    id: 'perp-yield',
    description:
      'Perp DEXs, derivatives, options, yield protocols, vaults, liquid staking tokens (LSTs), restaking, yield farming',
  },
  {
    id: 'new-networks',
    description: 'L1/L2 blockchains, appchains, rollups, bridges, cross-chain infrastructure, oracles, data availability',
  },
  {
    id: 'solver-marketplaces',
    description: 'Intent-based solvers, RFQ systems, order-flow auction platforms, programmatic market-makers',
  },
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  const categoryList = CATEGORIES.map(c => `  ${c.id}: ${c.description}`).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      // Haiku is fast and cheap — this is a simple single-token classification.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: `You are classifying a DeFi/Web3 protocol into one partner category for SODAX, a cross-chain liquidity platform.

Categories:
${categoryList}

Protocol name: "${name}"

Reply with only the category ID (e.g. "wallets"). No explanation, no punctuation.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'classification failed', status: res.status }, { status: 502 });
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text?.trim().toLowerCase();
  const match = CATEGORIES.find(c => c.id === raw);

  if (!match) {
    return NextResponse.json({ error: 'unrecognised category', raw }, { status: 422 });
  }

  return NextResponse.json({ categoryId: match.id });
}
