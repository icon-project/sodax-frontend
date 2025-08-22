# Deployment Guide for Sonic Blaze Testnet

This guide walks you through deploying the EIP-7702 `BatchCallAndSponsor` contract to the Sonic Blaze testnet.

## Prerequisites

1. **Foundry installed** and up to date
2. **Private key** with some testnet ETH
3. **Access to Sonic Blaze RPC**: https://rpc.sonicblaze.io

## Step 1: Environment Setup

Set your private key as an environment variable:

```bash
export PRIVATE_KEY="0x1234567890abcdef..." # Your actual private key
```

## Step 2: Build Contracts

```bash
cd apps/eip-7702
forge build
```

## Step 3: Deploy to Sonic Blaze

```bash
# Deploy the BatchCallAndSponsor contract
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sonicblaze.io \
  --broadcast \
  --verify
```

## Step 4: Verify Deployment

1. **Check deployment logs** for the contract address
2. **Visit Sonic Blaze Explorer**: https://explorer.sonicblaze.io
3. **Search for your contract address**
4. **Verify the contract is deployed** and has the correct bytecode

## Step 5: Fund the Contract

The contract needs ETH to execute batch calls. You can:

1. **Send ETH directly** to the contract address
2. **Use the contract's receive function** by sending ETH in a transaction

## Step 6: Update Configuration

Update the contract addresses in your test files:

```typescript
// In src/viem-test.ts and examples/basic-usage.ts
const BATCH_CONTRACT_ADDRESS = '0x...' as Address; // Your deployed address
const MOCK_TARGET_ADDRESS = '0x...' as Address;    // Deploy MockTarget or use existing
```

## Step 7: Test the Contract

### Run Foundry Tests
```bash
forge test
```

### Run Viem Tests
```bash
npx ts-node src/viem-test.ts
```

### Run Basic Usage Example
```bash
npx ts-node examples/basic-usage.ts
```

## Deployment Verification

After deployment, verify:

- ✅ Contract is deployed on Sonic Blaze (Chain ID: 8080)
- ✅ Contract has the correct bytecode
- ✅ Contract can receive ETH
- ✅ Nonce starts at 0
- ✅ All functions are callable

## Troubleshooting

### Common Issues

1. **Insufficient gas**: Increase gas limit
2. **RPC errors**: Check Sonic Blaze RPC status
3. **Verification fails**: Ensure contract source matches deployed bytecode
4. **Private key issues**: Verify environment variable is set correctly

### Gas Settings

For Sonic Blaze, typical gas settings:
- **Gas limit**: 5,000,000 (adjust based on contract size)
- **Gas price**: Use network default or set manually

## Next Steps

After successful deployment:

1. **Test all contract functions**
2. **Implement signature creation** for batch execution
3. **Test with real transactions** on Sonic Blaze
4. **Monitor contract activity** on the explorer
5. **Consider upgrading** to mainnet when ready

## Support

- **Sonic Blaze RPC**: https://rpc.sonicblaze.io
- **Sonic Blaze Explorer**: https://explorer.sonicblaze.io
- **Foundry Documentation**: https://book.getfoundry.sh/
- **Viem Documentation**: https://viem.sh/ 