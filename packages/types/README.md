# @sodax/types

Shared TypeScript types and constants used throughout Sodax libraries.

## Overview

This package provides a centralized collection of type definitions and constants for the Sodax ecosystem, including:

- **Chain configurations**: Hub and spoke chain definitions for EVM, Solana, Stellar, Sui, ICON, and Injective
- **Token definitions**: Supported tokens, hub assets, and vault configurations
- **Chain-specific types**: Wallet provider interfaces and transaction types for each supported blockchain
- **Backend API types**: Type definitions for configuration API responses

## Structure

- **`common/`**: Core types for chains, tokens, addresses, and chain configurations
- **`constants/`**: Chain IDs, token definitions, hub vaults, and spoke chain configurations
- **`backend/`**: API response types for configuration endpoints
- **`evm/`**: EVM-specific transaction and wallet provider types
- **`stellar/`**: Stellar-specific transaction and wallet provider types
- **`solana/`**: Solana-specific transaction and wallet provider types
- **`sui/`**: Sui-specific transaction and wallet provider types
- **`icon/`**: ICON-specific transaction and wallet provider types
- **`injective/`**: Injective-specific transaction and wallet provider types

## Usage

```typescript
import type { ChainId, Token, SpokeChainConfig } from '@sodax/types';
import { CHAIN_IDS, spokeChainConfig } from '@sodax/types';
```

