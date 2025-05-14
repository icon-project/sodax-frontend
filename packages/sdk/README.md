# New Worl SDK

TODO

## Solver SDK

Solver SDK provides abstractions to assist you with interacting with the cross-chain Intent Smart Contracts and Solver.

### Installation

#### NPM

Installing through npm:

`npm i --save @todo/sdk`

**NOTE** Package is not yet published to the npm registry!!!

#### Local Installation

Package can be locally installed by following this steps:

1. Clone this repository to your local machine.
2. `cd` into repository folder location.
3. Execute `pnpm install` command in your CLI to install dependencies.
4. Execute `pnpm run build` to build the packages.
5. In your app repository `package.json` file, define dependency named `"@todo/sdk"` under `"dependencies"`.
   Instead of version define absolute path to your SDK repository `"file:<sdk-repository-path>"` (e.g. `"file:/Users/dev/.../operation-liquidity-layer/packages/sdk"`).
   Full example: `"@todo/sdk: "file:/Users/dev/operation-liquidity-layer/sdk-new/packages/sdk"`.

### Local Development

How to setup local development

1. Clone repository.
2. Make sure you have [Node.js](https://nodejs.org/en/download/package-manager) v18+ and corresponding npm installed on your system.
3. Execute `pnpm install` command (from root of the project) in your CLI to install dependencies.
4. Make code changes.
   1. Do not forget to export TS files in same folder `index.ts`.
   2. Always import files using `.js` postfix.
5. Before commiting execute `npm run prepublishOnly` in order to verify build, format and exports.

### Intent Solver Endpoints

Current Intent Solver API endpoints:
- **Production (mainnet)**: "TODO"
- **Staging** (mainnet): "https://staging-new-world.iconblockchain.xyz"

**Note** Staging endpoint contains features to be potentially released and is subject to frequent change!

## Relayer API Endpoints

Current Relayer API endpoints:
- **Production (mainnet)**: "https://xcall-relay.nw.iconblockchain.xyz"
- **Staging** (mainnet): "https://testnet-xcall-relay.nw.iconblockchain.xyz"

**Note** Staging endpoint contains features to be potentially released and is subject to frequent change!

## Load SDK Config

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

```typescript
import { getHubChainConfig, supportedHubAssets, supportedHubChains, supportedSpokeChains, supportedHubAssets, spokeChainConfig } from "@todo/sdk"

const hubChainConfig = getHubChainConfig(SONIC_MAINNET_CHAIN_ID);

// all supported hub chains (Sonic mainnet and testnet)
export const hubChains: HubChainId[] = supportedHubChains;

// all supported spoke chains
export const spokeChains: SpokeChainId[] = supportedSpokeChains;

// all hub assets (original asset addresses mapped to "Abstracted evm addresses")
export const hubAssets: Set<Address> = supportedHubAssets;

// record 
export spokeChainConfigRecord : Record<SpokeChainId, SpokeChainConfig> = spokeChainConfig;
```

### Initialising Providers

SDK abstracts away the wallet and public RPC clients using `SpokeProvider` TS type which can be one of the following:

- `EvmSpokeProvider`: Provider used for EVM type chains (ETH, BSC, etc..). Implemented using [viem](https://viem.sh/docs/clients/wallet#json-rpc-accounts).

Providers are used to request wallet actions (prompts wallet extension) and make RPC calls to the RPC nodes.

EVM Provider example:

```typescript
import { EvmProvider, EvmHubProvider, EvmSpokeProvider, AVALANCHE_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from "@todo/sdk"

// wallet provider represents users connected wallet, should be instantiated when user connects wallet
// NOTE: you can construct instance from EvmUninitializedConfig or EvmInitializedConfig
const evmWalletProvider: EvmWalletProvider = new EvmWalletProvider({
  chain: BSC_MAINNET_CHAIN_ID,
  privateKey: '0xe012345...123456' as Hex, // NOTE: random private key for unit testing only
  provider: 'https://polygon.infura.io/v3/1234567890',
});

// spoke provider represents connection to a specific chain, should be instantiated for each supported chain
const bscSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
);

const hubProvider = new EvmHubProvider(evmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

```

### Request a Quote

Requesting a quote should require you to just consume user input amount and converting it to the appropriate token amount (scaled by token decimals).
All the required configurations (chain id [nid], token decimals and address) should be loaded as described in [Load SDK Config](#load-sdk-config).

Quoting API supports different types of quotes:
- "exact_input": "amount" parameter is the amount the user want's to swap (e.g. the user is asking for a quote to swap 1 WETH to xxx SUI)
- "exact_output": "amount" parameter is the final amount the user wants. (e.g. the user want's to swap WETH for SUI, but is asking how many WETH is going to cost to have 1 SUI)

```typescript
import { SolverService } from "@iconproject/intents-sdk"

const solverService = new SolverService({
  intentsContract: "0x..."; // Intents Contract (Hub)
  solverApiEndpoint: "https://staging-new-world.iconblockchain.xyz";
  relayerApiEndpoint: "https://xcall-relay.nw.iconblockchain.xyz"
});

  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const bscEthHubTokenAsset = getHubAssetInfo(BSC_MAINNET_CHAIN_ID, bscEthToken);

  if (!bscEthHubTokenAsset) {
    throw new Error('BSC ETH token asset not found');
  }

  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';
  const arbWbtcHubTokenAsset = getHubAssetInfo(ARBITRUM_MAINNET_CHAIN_ID, arbWbtcToken);

  if (!arbWbtcHubTokenAsset) {
    throw new Error('BSC WBTC token asset not found');
  }

const quoteResult = await solverService.getQuote({
    token_src: bscEthHubTokenAsset.asset, // Hub Asset BSC
    token_dst: arbWbtcHubTokenAsset.asset, // Hub Asset ETH Arbitrum
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
    amount: 1000000000000000n,
    quote_type: "exact_input"
})
```

### Create Intent Order

Creating Intent Order requires creating spoke provider for the chain that intent is going to be created on (`token_src_blockchain_id`).

Example for BSC -> ARB Intent Order:

```typescript
import {
  SolverService,
  SolverConfig,
  BSC_MAINNET_CHAIN_ID,
  EvmWalletProvider,
  EvmSpokeProvider
} from "@todo/intents-sdk"

const solverConfig {
  intentsContract: "0x...",
  solverApiEndpoint: "https://staging-new-world.iconblockchain.xyz",
  relayerApiEndpoint: "https://xcall-relay.nw.iconblockchain.xyz",
} satisfies SolverConfig;

const evmWalletProvider = new EvmWalletProvider({
    chain: BSC_MAINNET_CHAIN_ID,
    privateKey: '0x...' as Hex,
    provider: 'https://polygon.infura.io/v3/1234567890',
  })

const bscSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
)

const hubProvider = new EvmHubProvider(evmWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
const bscEthHubTokenAsset = getHubAssetInfo(BSC_MAINNET_CHAIN_ID, bscEthToken);

if (!bscEthHubTokenAsset) {
  throw new Error('BSC ETH token asset not found');
}

const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';
const arbWbtcHubTokenAsset = getHubAssetInfo(ARBITRUM_MAINNET_CHAIN_ID, arbWbtcToken);

if (!arbWbtcHubTokenAsset) {
  throw new Error('BSC WBTC token asset not found');
}

const createIntentParams = {
  inputToken: bscEthHubTokenAsset.asset,                      // The address of the input token on hub chain
  outputToken: arbWbtcHubTokenAsset.asset,                    // The address of the output token on hub chain
  inputAmount: BigInt(1000000),                               // The amount of input tokens
  minOutputAmount: BigInt(900000),                            // The minimum amount of output tokens to accept
  deadline: BigInt(0),                                        // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: false,                                    // Whether the intent can be partially filled
  srcChain: BSC_MAINNET_CHAIN_ID,                             // Chain ID where input tokens originate
  dstChain: ARBITRUM_MAINNET_CHAIN_ID,                        // Chain ID where output tokens should be delivered
  srcAddress: evmWalletProvider.getWalletAddressBytes(),      // Source address in bytes (original address on spoke chain)
  dstAddress: evmWalletProvider.getWalletAddressBytes(),      // Destination address in bytes (original address on spoke chain)
  solver: '0x0000000000000000000000000000000000000000',       // Optional specific solver address (address(0) = any solver)
  data: '0x',                                                 // Additional arbitrary data
} satisfies CreateIntentParams;

// creates and submits on-chain transaction or returns raw transaction
// NOTE: after intent is created on-chain it should also be posted to Solver API and submitted to Relay API
// see below example of createAndSubmitIntent
const [result0, intent] = await solverService.createIntent(
  createIntentParams,
  bscSpokeProvider,
  hubProvider,
  false, // true = get raw transaction, false = execute and return tx hash
);

// create on-chain intent, post to Solver API and Submit to Relay API
// NOTE: you should primarily use this one to create intent
const result1 = await solverService.createAndSubmitIntent(
  createIntentParams,
  bscSpokeProvider,
  hubProvider,
);

if (result1.ok) {
  const [txHash, intent] = result1.value;
} else {
  // handle error
}
```

### Get Intent Order

Retrieve intent data using tx hash obtained from intent creation response.

```typescript
const intent = await solverService.getIntent(txHash, hubProvider);
```

### Cancel Intent Order

Active Intent Order can be cancelled using Intent. See [Get Intent Order](#get-intent-order) on how to obtain intent.
**Note** create intent functions also return intent data for convenience.

```typescript

const result = await solverService.cancelIntent(
  intent,
  bscSpokeProvider,
  hubProvider,
  false, // true = get raw transaction, false = execute and return tx hash
);
```

### Get Intent Status

Retrieve status of intent.

```typescript
const result = await solverService.getStatus({
    intent_tx_hash: '0x...', // tx hash of create intent blockchain transaction
  } satisfies IntentStatusRequest);
```

### Get Intent Hash

Get Intent Hash (keccak256) used as an ID of intent in smart contract.

```typescript
const intentHash = solverService.getIntentHash(intent);
```

## Intent Relay API Service

The Intent Relay API Service provides functionality for submitting transactions and retrieving transaction packets across different chains. This service is part of the cross-chain communication infrastructure.

### Available Actions

1. `submit` - Submit a transaction to the intent relay service
2. `get_transaction_packets` - Get transaction packets from the intent relay service
3. `get_packet` - Get a specific packet from the intent relay service

### Transaction Status Types

- `pending` - No signatures
- `validating` - Not enough signatures
- `executing` - Enough signatures, no confirmed txn-hash
- `executed` - Has confirmed transaction-hash

### API Examples

#### Submit Transaction

```typescript
const request = {
  action: 'submit',
  params: {
    chain_id: '1',
    tx_hash: '0x123',
  },
}  satisfies IntentRelayRequest<'submit'>;

const response: SubmitTxResponse = await submitTransaction(request, 'https://api.example.com/relay');
// Response:
{
  "success": true,
  "message": "Transaction registered"
}
```

#### Get Transaction Packets

```typescript
const request = {
  action: 'get_transaction_packets',
  params: {
    chain_id: '1',
    tx_hash: '0x123',
  },
} satisfies IntentRelayRequest<'get_transaction_packets'>;

const response: GetTransactionPacketsResponse = await getTransactionPackets(request, 'https://api.example.com/relay');

// Response:
{
    "success": true,
    "data": [
        {
            "src_chain_id": 6,
            "src_tx_hash": "0x23a7eae34f6acf5cfadc43e714a4d188b0d6526b95c82c9b969e69d7222df5de",
            "src_address": "a8e168789b1fa96de2fb816df56757ad950438a4",
            "status": "executed",
            "dst_chain_id": 146,
            "conn_sn": 54,
            "dst_address": "67a8cf2543a30b292a443430df213983951dca08",
            "dst_tx_hash": "0xd7f1cf40154d3123eda3a94622bae13d879307fd3526cb45dd50951fee9cd244",
            "signatures": [
                "c172723dba3aec0f98d6602fcfbbcae9873ce3f4fc0eded70d64b6ad3f7806aa0b22d0fa3ea57679ec05f8c51a8562c9c979d247330966e9aaaf34a4dfae64e001"
            ],
            "payload": "cafebabe"
        }
    ]
}
```

#### Get Packet

```typescript
const request = {
  action: 'get_packet',
  params: {
    chain_id: '1',
    tx_hash: '0x123...abc',
    conn_sn: '1'
  }
} satisfies IntentRelayRequest<'get_packet'>;

const response: GetPacketResponse = await getPacket(request, 'https://api.example.com/relay');
// Response:
{
    "success": true,
    "data": {
        "src_chain_id": 6,
        "src_tx_hash": "0x781554a94bbd2ebd79ebaa01c645781ddf46610e5f1af8e5735d58b95ca6fbd6",
        "src_address": "1d790ac96a0da4c249fd8838a7cc46b91fee3c5a",
        "status": "executing",
        "dst_chain_id": 21,
        "dst_address": "0x26f83c5996f79229ef16cf7ca49eeb8682535e81ab59c30e561cc317bcc96a4a::sampledapp::0xde956ead1ac2c8fa99cb9851cb10003d6a08b1fa3120a3f073d576389dbb44fc",
        "conn_sn": 14,
        "signatures": [
                "c172723dba3aec0f98d6602fcfbbcae9873ce3f4fc0eded70d64b6ad3f7806aa0b22d0fa3ea57679ec05f8c51a8562c9c979d247330966e9aaaf34a4dfae64e001"
            ],
        "payload": "cafebabe"
    }
}
```

### Type Definitions

For detailed type definitions, refer to the source code in `packages/sdk/src/services/intentRelay/IntentRelayApiService.ts`.
