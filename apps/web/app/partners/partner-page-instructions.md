Briefing Document: SODAX Partners Page Construction

1. Project Overview

The objective is to design and develop a comprehensive "Partners" ecosystem surface for sodax.com/partners. This page will serve as the primary entry point for B2B builders, integrators, and network teams looking to leverage SODAX's execution and liquidity infrastructure.

The page must transition from a high-level value proposition for the "Preferred Partner Network" into specific, modular use-cases and deep-dive case studies (e.g., /partners/amped-finance). The tone must remain "infra-serious": calm, competent, and outcome-oriented, avoiding "bridge" terminology in favor of "execution coordination."


--------------------------------------------------------------------------------


2. Core Messaging Architecture

All copy and structure must align with the following brand pillars:

* Execution Coordination over Asset Movement: SODAX is not a bridge; it is a system that reasons across networks to deliver outcomes.
* Outcome-Oriented: Prioritize whether the user reaches the intended asset/position, not just theoretical speed.
* Builder-First: Abstract complexity while keeping builders in control of UX and economics.
* Honest Constraints: Acknowledge asynchronous execution and failure modes as technical realities.


--------------------------------------------------------------------------------


3. Page Structure & Content Modules

3.1 Hero Section

* Headline: Coordinate Execution. Deliver Outcomes.
* Sub-headline: Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.
* CTA: [Become a Partner / Contact Form] | [Explore Documentation]

3.2 Partner Categories (The "Ideal For" Grid)

Group partners into specific segments based on the SODAX Documentation:

* Wallets: Native cross-network swaps and any-asset card top-ups (e.g., Hana Wallet).
* DEXs & Aggregators: Route users to the best price across 12+ networks using SODAX as a settlement layer.
* Lending Protocols: Enable "Cross-Network Collateral" where users supply on one network and borrow on another.
* Perp DEXs & Yield Apps: Accept deposits from any network (e.g., USDC on Solana) and settle into native assets (e.g., USDC on Sonic).
* New Networks: Bootstrap liquidity and stablecoin utility on day one through the SODAX Hub.

3.3 The SODAX Advantage (Why Partners Choose Us)

* Invisible Complexity: Handle routing, bridging, and error recovery in the background.
* True Network Abstraction: Seamlessly connect EVM and non-EVM environments (Solana, Sui, Stellar).
* Shared Economics: Revenue sharing on protocol fees and solver execution for routed volume.
* Composability: Modular SDKs that allow integration of specific features (swaps, lending, or wallets) independently.

3.4 Featured Case Studies (Sub-page Previews)

These will link to dedicated use-case pages like /partners/amped-finance.

* Amped Finance: Launched a multi-chain money market in 2–4 days; provides LightLink’s primary cross-network interface.
* Hana Wallet: Integrated intent-based trades settling in ~22 seconds; supports 47,000+ users with real-world crypto spending.
* LightLink Network: Integrated at the network level to offer native asset representation (e.g., BTC.LL, SOL.LL) and deep liquidity without user-visible bridging delays.

3.5 Network Integration Package (For Infrastructure Partners)

A specialized section for L1/L2 teams:

* The Scope: Full infrastructure deployment including asset management contracts, relay network integration, and solver liquidity sourcing.
* Timeline: 4 to 6 weeks for standard deployment.
* Fee Structure (Internal reference for sales routing): | Network Stack | One-time Fee | | :--- | :--- | | EVM Compatible | $40,000.00 | | Cosmos SDK | $80,000.00 | | Custom / Non-standard | $150,000.00 |


--------------------------------------------------------------------------------


4. Visual & Technical Guidelines

4.1 Design Principles

* Typography: Primary font is Inter. Use Shrikhand (lowercase only) for very short, high-impact accents or CTAs (3–4 words max).
* Palette:
  * Primary: Cherry Soda (#A55C55) and Yellow Soda (#FFD92F).
  * Backgrounds: Cream White (#EDE6E6) or Vibrant White (#F9F7F5) to maintain a "roomy" and professional UI feel.
* Layout: Generous spacing and "extreme hierarchy." One dominant element per screen. Use medium-rounded corners for cards.
* Motion: Follow the "Trap and Release" principle—continuous micro-movements that create attention without chaos. No "dead" frames.

4.2 Integration Stack for Developers

The page must reference the three-layer SDK hierarchy:

1. Foundation Layer (@sodax/sdk): Core logic, swaps, lending, and bridging primitives.
2. Connection Layer (@sodax/wallet-sdk-react): Opinionated React wrapper for managing cross-chain wallet providers.
3. Experience Layer (@sodax/dapp-kit): Pre-built UI components and hooks for rapid deployment.


--------------------------------------------------------------------------------


5. Agent Instructions for Building /partners/[use-case]

When generating sub-pages for specific partners (e.g., /partners/amped-finance), the agent must:

1. Extract Specific Outcomes: Highlight metrics like "2 weeks to integrate" or "14+ networks accessible."
2. Include Social Proof: Use quotes from partner founders (e.g., Daniel Enright from Amped).
3. Visualizing the Integration: Show the specific SDK components used (e.g., "Foundation Layer + Experience Layer").
4. Problem/Solution Mapping: Clearly define the partner's "Challenge" (e.g., fragmented liquidity, slow bridges) and the "SODAX Solution" (e.g., intent-based execution, Unified Liquidity Layer).


--------------------------------------------------------------------------------


6. Call to Action & Lead Generation

The page must conclude with a clear path to the Partnerships Manager (Arosh Ediriweera) or a standardized contact form.

* Copy: "Build faster without becoming a cross-network infrastructure team."
* Links: Documentation, GitHub Repos, and Contact Form.
