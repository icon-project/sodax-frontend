# The SODA Token  
Participation and coordination inside the SODAX execution system

---

## 1. TL;DR (Executive Summary)

- **Protocol participation token**  
  SODA is the native utility and governance token of the SODAX execution coordination system. It aligns liquidity participation, execution incentives, and protocol governance across the SODAX network.

- **Fixed supply with protocol-driven burns**  
  SODA has a hard supply cap of 1.5 billion tokens. A portion of real protocol revenue is used to market-buy and permanently burn SODA, linking supply reduction directly to system usage rather than emissions.

- **Execution-native by design**  
  SODA underpins how liquidity, solvers, and governance interact inside SODAX’s hub-and-spoke architecture, anchored on Sonic and extended across multiple networks. It supports predictable cross-network execution under real-world constraints, not speculative incentives.

---

## 2. What is SODA?

SODA is the native utility and governance token of the SODAX execution coordination system.

SODAX is built as an outcome-oriented cross-network execution system. It coordinates liquidity and execution across heterogeneous networks so applications can deliver intended financial outcomes without becoming cross-network infrastructure companies.

Within this system, SODA provides the economic layer that:

- aligns solver incentives with execution reliability  
- enables participation in protocol-managed liquidity  
- governs how the system evolves over time  

SODA is not designed as a transfer token or a routing shortcut. It exists to support execution coordination under asynchronous conditions, where liquidity availability, partial failure, and recovery paths are real operational constraints.

---

## 3. SODA’s Role Inside the SODAX System

SODA functions as the coordination and participation token across the core execution components of SODAX.

### The Hub (Sonic)

The Sonic network acts as the coordination hub for accounting, smart-wallet abstraction, and composable execution.

SODA enables consistent protocol-level participation across all connected networks, allowing users and solvers to participate in cross-network flows without managing fragmented identities or balances across spokes.

### Solver Incentives (Execution Coordination)

Solvers reason across networks and liquidity domains to route and execute user intents.

SODA provides the incentive layer that aligns solver behavior with:

- execution reliability  
- recoverable failure handling  
- outcome completion rather than single-step routing  

This design prioritizes predictable execution behavior over theoretical optimality.

### Unified Liquidity Layer

SODA integrates directly into the protocol’s coordinated liquidity layer, which combines:

- local network liquidity  
- SODAX money market liquidity  
- protocol-owned liquidity where external markets do not exist  

Yield-bearing variants such as staticASoda allow liquidity to remain productive while simultaneously supporting execution flows.

This model allows liquidity to be coordinated dynamically without forcing duplication or idle balances across networks.

---

## 4. Token Utility: Current and Planned

| Domain | Current Utility | Directional / Planned |
|--------|-----------------|------------------------|
| **Staking & Participation** | Stake SODA to receive xSODA and participate in protocol revenue distribution. Lock durations up to 180 days align rewards with long-term participation. | Expanded commitment models inspired by ve-style mechanisms to strengthen long-term alignment and governance participation. |
| **Liquidity Participation** | Use staticASoda in liquidity pools to earn money market yield and DEX fees simultaneously. | Deeper cross-network collateralization and integration into institutional liquidity products. |
| **Governance** | Direct voting for the Protocol Council or abstention. | Progressive decentralization with more expressive voting mechanisms such as liquid democracy and quadratic voting. |
| **Migration** | ICX to SODA migration utilities via the SODAX SDK. | Continued tooling to support ecosystem transitions as the network evolves. |

---

## 5. Token Mechanics (Economic Design)

### Supply

SODA has a fixed maximum supply of **1.5 billion tokens**.

A one-time mint of 400 million SODA is held by the DAO and reserved for ecosystem growth, liquidity bootstrapping, and strategic incentives. No ongoing inflation or scheduled emissions exist.

There are no public mint functions. Supply can only decrease through protocol-driven burns.

### Revenue Allocation Model

All protocol revenue, including money market interest, DEX fees, and execution fees, flows into a single Fee Treasury and is distributed as follows:

- **20% Burn**  
  Used to market-buy and permanently burn SODA. Supply reduction is directly linked to real system usage.

- **50% Protocol-Owned Liquidity (POL)**  
  Reinvested into protocol-managed liquidity to support execution reliability and solver inventory across networks.

- **20% Staking Rewards**  
  Distributed to xSODA holders to reward long-term participation and alignment.

- **10% DAO and Incentives**  
  Allocated for ecosystem growth, partnerships, and protocol development.

This design prioritizes sustainability and execution reliability over emission-driven incentives.

---

## 6. Governance

SODAX currently operates under a Protocol Council model designed for early-stage coordination and fast iteration.

- **Structure**: 7 council seats  
- **Participation**: SODA holders vote directly or abstain  
- **Incentives**: Council roles are voluntary and non-technical  

This model avoids delegation to validators and reduces concentration risk while the protocol matures. Governance mechanisms are designed to evolve progressively as execution reliability and decentralization increase.

---

## 7. Staking and Incentives

Staking aligns long-term participants with protocol health rather than short-term speculation.

- **xSODA**  
  Staked SODA converts into xSODA, which receives a share of the 20% revenue allocation.

- **Lock Durations**  
  Flexible or locked staking up to 180 days. Rewards scale with commitment length.

- **Early Exit Penalties**  
  Early withdrawals incur a penalty redistributed to remaining stakers, reinforcing long-term alignment.

This model rewards patience, participation, and contribution to execution reliability.

---

## 8. Network Presence

SODA is deployed as a hub-anchored, multi-network asset.

- **Primary hub**: Sonic  
- **Spoke deployments**: Ethereum, Arbitrum, Optimism, Base, Avalanche, Polygon, Nibiru, Botanix, and others  

The hub-and-spoke design allows SODA to participate in execution coordination across heterogeneous environments while maintaining a single canonical supply.

Contract addresses and deployment status are maintained in the technical appendix.

---

## 9. Risks and Constraints

SODA inherits the operational realities of cross-network execution systems.

- **Volume dependency**  
  Burn rates scale with protocol usage. Low activity results in lower buyback pressure.

- **Treasury exposure**  
  Protocol-Owned Liquidity (POL) is exposed to crypto asset volatility, which may affect yield and execution capacity.

- **Governance concentration**  
  Large holders may exert disproportionate influence until governance mechanisms mature.

- **Regulatory uncertainty**  
  Staking, burning, and DeFi participation models remain subject to evolving regulatory frameworks.

SODAX is explicit about these constraints. Execution is asynchronous, failure-aware, and not guaranteed.

---

## 10. FAQ (Selected)

**What is the maximum supply of SODA?**  
1.5 billion tokens, fixed. No further minting is possible.

**How does SODA become deflationary?**  
20% of real protocol revenue is used to buy and permanently burn SODA.

**What is Protocol-Owned Liquidity (POL)?**  
Protocol-managed liquidity that supports execution reliability and solver inventory across networks.

**How do staking rewards work?**  
By staking SODA into xSODA, participants receive a share of protocol revenue, with higher rewards for longer commitments.

**What is staticASoda?**  
A yield-bearing SODA variant that earns money market interest while providing DEX liquidity.

**Which networks are supported?**  
12+ networks including Sonic, Ethereum, Arbitrum, Avalanche, Solana, Sui, and others.

---

## 11. Open Questions / To Confirm

- Final trading fee baseline, 0.15% versus 0.30%  
- Ownership finalization for several hub contracts  

---
