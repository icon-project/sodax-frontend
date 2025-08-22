# EIP-7702 Testing Environment on Sonic Blaze

This project provides a testing environment for EIP-7702 using Foundry and Viem, specifically configured for the Sonic Blaze testnet. It implements EIP-7702 exactly as described in the [QuickNode guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/eip-7702-smart-accounts).

## What is EIP-7702?

EIP-7702 allows EOAs (Externally Owned Accounts) to upgrade to smart contract accounts while maintaining their original address and private key. This enables:

- **Account Abstraction**: EOAs become smart contract accounts
- **Batch transaction execution**: Multiple calls in a single transaction
- **Gasless transactions**: Via signature verification
- **Enhanced security**: Smart contract-level security features
- **Backward compatibility**: Original private key still works

## How EIP-7702 Works (Per QuickNode Guide)

The implementation follows the QuickNode guide exactly:

1. **Deploy the `BatchCallAndSponsor` contract**
2. **Use Viem's `writeContract` with the `account` parameter**
3. **Viem automatically handles the EIP-7702 delegation**

### Key Implementation Details

```typescript
// This is the key part from the QuickNode guide:
// Using writeContract with account parameter enables EIP-7702
const hash = await walletClient.writeContract({
  address: batchContractAddress,
  abi: BATCH_CALL_ABI,
  functionName: 'execute',
  args: [calls],
  value: totalValue,
  // The account parameter enables EIP-7702 delegation
  account: account
});
```

**No custom delegation contracts needed** - Viem handles everything automatically!

## Sonic Blaze Testnet

This environment is configured for **Sonic Blaze testnet**:
- **Chain ID**: 8080
- **RPC URL**: https://rpc.sonicblaze.io
- **Explorer**: https://explorer.sonicblaze.io
- **Native Token**: ETH
- **Testnet**: Yes

## Project Structure

```
apps/eip-7702/
├── contracts/
│   └── BatchCallAndSponsor.sol    # Batch execution contract (from QuickNode guide)
├── test/
│   └── BatchCallAndSponsor.t.sol  # Foundry tests
├── script/
│   └── Deploy.s.sol               # Deploy BatchCallAndSponsor
├── src/
│   └── viem-test.ts              # Viem testing utilities
├── examples/
│   ├── basic-usage.ts            # Basic usage examples
│   └── eip7702-delegation.ts     # EIP-7702 implementation (per QuickNode guide)
├── foundry.toml                   # Foundry configuration
└── README.md                      # This file
```

## Setup

### Prerequisites

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install Node.js dependencies**:
   ```bash
   cd apps/eip-7702
   npm install
   ```

### Installation

1. **Install OpenZeppelin contracts**:
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```

2. **Build the contracts**:
   ```bash
   forge build
   ```

## Usage

### Running Tests

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test test_ExecuteWithSignature

# Run with gas reporting
forge test --gas-report
```

### Deployment to Sonic Blaze

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key_here"

# Deploy BatchCallAndSponsor contract
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sonicblaze.io \
  --broadcast
```

### Testing on Sonic Blaze

1. **Get testnet ETH**:
   - Visit Sonic Blaze faucet (if available)
   - Or transfer from another network

2. **Update contract addresses**:
   - Replace placeholder addresses in `src/viem-test.ts`
   - Replace placeholder addresses in `examples/eip7702-delegation.ts`

3. **Test EIP-7702 functionality**:
   ```bash
   # Test basic functionality
   npx ts-node src/viem-test.ts
   
   # Test EIP-7702 (per QuickNode guide)
   npx ts-node examples/eip7702-delegation.ts
   ```

## Contract Overview

### BatchCallAndSponsor

The batch execution contract from the QuickNode guide:

- **`execute(Call[] calls, bytes signature)`**: Execute batch with signature
- **`execute(Call[] calls)`**: Execute batch directly (for EIP-7702)
- **Nonce-based replay protection**
- **Signature verification using ECDSA**

### Call Structure

```solidity
struct Call {
    address to;      // Target contract address
    uint256 value;   // ETH value to send
    bytes data;      // Function call data
}
```

## Testing with Viem

### Basic Testing
```typescript
import { EIP7702Tester } from './src/viem-test';

const tester = new EIP7702Tester(
  privateKey,
  batchContractAddress,
  mockTargetAddress
);

// Execute batch calls
const batchCall = tester.createBatchCall([42, 100, 123]);
const txHash = await tester.executeDirectly(batchCall);
```

### EIP-7702 Implementation (Per QuickNode Guide)
```typescript
import { EIP7702Tester } from './examples/eip7702-delegation';

const tester = new EIP7702Tester(
  privateKey,
  batchContractAddress,
  mockTargetAddress
);

// Execute via EIP-7702 (Viem handles delegation automatically)
const txHash = await tester.executeBatchEIP7702(batchCall);
```

## Key Features

1. **QuickNode Guide Compliant**: Exact implementation from the guide
2. **Viem Built-in Support**: Uses Viem's native EIP-7702 functionality
3. **No Custom Delegation**: Viem handles delegation automatically
4. **Signature Verification**: Off-chain signatures for execution
5. **Replay Protection**: Nonce-based protection against replay attacks
6. **Gas Optimization**: Efficient batch processing
7. **Sonic Blaze Integration**: Full testnet support

## Testing Scenarios

The test suite covers:

- ✅ Contract deployment and setup
- ✅ Batch execution via EIP-7702
- ✅ Signature-based execution
- ✅ Replay protection
- ✅ Invalid signature rejection
- ✅ Nonce management

## Sonic Blaze Specific Commands

```bash
# Deploy BatchCallAndSponsor contract
forge script script/Deploy.s.sol --rpc-url https://rpc.sonicblaze.io --broadcast

# Test against Sonic Blaze fork (if supported)
forge test --fork-url https://rpc.sonicblaze.io

# Verify contract on Sonic Blaze
forge verify-contract <CONTRACT_ADDRESS> contracts/BatchCallAndSponsor.sol --chain-id 8080
```

## Security Considerations

- **Private Key Management**: Never expose private keys in production
- **Signature Verification**: Always verify signatures on-chain
- **Nonce Management**: Nonces must be unique and sequential
- **Testnet Usage**: Sonic Blaze is a testnet - don't use real funds

## Reference

This implementation follows the [QuickNode EIP-7702 guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/eip-7702-smart-accounts) exactly.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 