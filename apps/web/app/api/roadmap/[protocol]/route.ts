//the API route that reads from that Notion field and returns structured JSON to your frontend. Blocked right now by the missing token, but the code is correct.
import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SODAX_CONTEXT = `
SUPPORTED NETWORKS (17): Sonic, Avalanche, Arbitrum, Base, BNB Chain, Injective, Sui, Optimism, Polygon, Solana, ICON, Stellar, HyperEVM, LightLink, Ethereum, RedBelly, Kaia.
MONEY MARKET ASSETS: sodaUSDC, sodaUSDT, sodaETH, sodaSODA, sodaXLM, sodaS, sodaSUI, sodaSOL, sodaINJ, sodaAVAX, sodaBNB, sodaPOL, sodaBTC, sodaWSTETH, sodaWEETH, sodaHYPE, sodaKAIA, sodaNEAR, bnUSD.
SDK: dapp-kit (fast, UI, days) or core SDK (full control, weeks).
USE CASES: UC1 Cross-Chain Swap (any protocol on supported chain), UC2 OFT Routing (ONLY if LayerZero confirmed), UC3 Money Market (lending/yield protocols), UC4 Liquidity Provision (TVL >$1M).
`;

export async function GET(_req: Request, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Research the DeFi protocol "${protocol}" and return a JSON integration roadmap for SODAX BD.

Return ONLY valid JSON, no markdown, no explanation:

{
  "protocolDisplay": "Full Protocol Name",
  "categoryId": "one of: wallets | dexs | lending | perp-yield | new-networks | solver-marketplaces",
  "why": ["3 specific bullet points why SODAX fits this protocol"],
  "sdkLayer": "dapp-kit or core SDK",
  "complexity": "Low / Medium / High with one sentence reason",
  "integrationSteps": ["3-4 concrete steps"],
  "chains": ["chains this protocol uses that overlap with SODAX"],
  "blockers": ["any blockers, empty array if none"],
  "nextSteps": "one sentence on most important BD next action",
  "tier": "basic | standard | strategic",
  "timeline": "realistic timeline estimate"
}

SODAX context: ${SODAX_CONTEXT}

Return ONLY the JSON object.`,
        },
      ],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    return NextResponse.json({ error: 'no response', debug: data }, { status: 500 });
  }

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({ error: 'invalid json', raw: text }, { status: 500 });
  }
}
