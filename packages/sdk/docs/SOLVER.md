## Solver SDK

Solver SDK provides abstractions to assist you with interacting with the cross-chain Intent Smart Contracts and Solver.

### Installation

#### NPM

Installing through npm:

`npm i --save @sodax/sdk`

**NOTE** Package is not yet published to the npm registry!!!

#### Local Installation

Package can be locally installed by following this steps:

1. Clone this repository to your local machine.
2. `cd` into repository folder location.
3. Execute `pnpm install` command in your CLI to install dependencies.
4. Execute `pnpm run build` to build the packages.
5. In your app repository `package.json` file, define dependency named `"@sodax/sdk"` under `"dependencies"`.
   Instead of version define absolute path to your SDK repository `"file:<sdk-repository-path>"` (e.g. `"file:/Users/dev/.../operation-liquidity-layer/packages/sdk"`).
   Full example: `"@sodax/sdk": "file:/Users/dev/operation-liquidity-layer/sdk-new/packages/sdk"`.

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
import { getHubChainConfig, supportedHubAssets, supportedHubChains, supportedSpokeChains, supportedHubAssets, spokeChainConfig } from "@sodax/sdk"

const hubChainConfig = getHubChainConfig(SONIC_MAINNET_CHAIN_ID);

// all supported hub chains (Sonic mainnet and testnet)
export const hubChains: HubChainId[] = supportedHubChains;

// all supported spoke chains
export const spokeChains: SpokeChainId[] = supportedSpokeChains;

// all hub assets (original asset addresses mapped to "Abstracted evm addresses")
export const hubAssets: Set<Address> = supportedHubAssets;

// record mapping spoke chain Id to spoke chain configs
export spokeChainConfigRecord : Record<SpokeChainId, SpokeChainConfig> = spokeChainConfig;
```

### Initialising Providers

SDK abstracts away the wallet and public RPC clients using `SpokeProvider` TS type which can be one of the following:

- `EvmSpokeProvider`: Provider used for EVM type chains (ETH, BSC, etc..). Implemented using [viem](https://viem.sh/docs/clients/wallet#json-rpc-accounts).

Providers are used to request wallet actions (prompts wallet extension) and make RPC calls to the RPC nodes.

EVM Provider example:

```typescript
import { EvmProvider, EvmHubProvider, EvmSpokeProvider, AVALANCHE_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from "@sodax/sdk"

// wallet provider represents users connected wallet, should be instantiated when user connects wallet
// NOTE: you can construct instance from EvmUninitializedConfig or EvmInitializedConfig
const evmWalletProvider: EvmWalletProvider = new EvmWalletProvider({
  chain: BSC_MAINNET_CHAIN_ID,
  privateKey: '0xe012345...123456' as Hex, // NOTE: random private key for unit testing only
  provider: 'https://bsc.infura.io/v3/1234567890',
});

// spoke provider represents connection to a specific chain, should be instantiated for each supported chain
const bscSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig,
);
```

### Initialising Sodax

Main entrypoint of Sodax features is going to be `Sodax` class instance.

```typescript
  const solverConfig = {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
    relayerApiEndpoint: 'https://testnet-xcall-relay.nw.iconblockchain.xyz',
    partnerFee: partnerFeePercentage, // optional
  } satisfies SolverConfig;

  const hubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  } satisfies EvmHubProviderConfig;

  // main instance to be used for all features
  const sodax = new Sodax({
    solver: solverConfig, // optional
    moneyMarket: moneyMarketConfig, // optional
    hubProviderConfig: hubConfig, // optional - defaults to Sonic mainnet as a hub provider
  });
```



### Request a Quote

Requesting a quote should require you to just consume user input amount and converting it to the appropriate token amount (scaled by token decimals).
All the required configurations (chain id [nid], token decimals and address) should be loaded as described in [Load SDK Config](#load-sdk-config).

Quoting API supports different types of quotes:
- "exact_input": "amount" parameter is the amount the user want's to swap (e.g. the user is asking for a quote to swap 1 WETH to xxx SUI)
- "exact_output": "amount" parameter is the final amount the user wants. (e.g. the user want's to swap WETH for SUI, but is asking how many WETH is going to cost to have 1 SUI)

```typescript
  import {
    Sodax,
    getHubChainConfig,
    BSC_MAINNET_CHAIN_ID,
    ARBITRUM_MAINNET_CHAIN_ID,
    IntentQuoteRequest,
    Result,
    IntentQuoteResponse,
    IntentErrorResponse
  } from "@sodax/sdk";

  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

  const quoteRequest = {
    token_src: bscEthToken,
    token_dst: arbWbtcToken,
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
    amount: 1000n,
    quote_type: 'exact_input',
  } satisfies IntentQuoteRequest;

  const result = await sodax.solver.getQuote(quoteRequest);

  if (result.ok) {
    // success
  } else {
    // handle error
  }
```

### Create And Submit Intent Order

Creating Intent Order requires creating spoke provider for the chain that intent is going to be created on (`token_src_blockchain_id`).

Example for BSC -> ARB Intent Order:

```typescript
  import {
    SolverService,
    SolverConfig,
    BSC_MAINNET_CHAIN_ID,
    ARBITRUM_MAINNET_CHAIN_ID
  } from "@sodax/sdk"

  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

  const mockCreateIntentParams = {
    inputToken: bscEthToken,
    outputToken: arbWbtcToken,
    inputAmount: BigInt(1000000),
    minOutputAmount: BigInt(900000),
    deadline: BigInt(0),
    allowPartialFill: false,
    srcChain: BSC_MAINNET_CHAIN_ID,
    dstChain: ARBITRUM_MAINNET_CHAIN_ID,
    srcAddress: mockEvmWalletProvider.getWalletAddressBytes(),
    dstAddress: mockEvmWalletProvider.getWalletAddressBytes(),
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  } satisfies CreateIntentParams;

  // creates and submits on-chain transaction or returns raw transaction
  // NOTE: after intent is created on-chain it should also be posted to Solver API and submitted to Relay API
  // see below example of createAndSubmitIntent which does that for you
  const createIntentOnlyResult = await sodax.solver.createIntent(
    mockCreateIntentParams,
    mockBscSpokeProvider,
    partnerFeeAmount,
    true, // true = get raw transaction, false = execute and return tx hash
  );

  if (!createIntentResult.ok) {
    // handle error
  }

  // txHash and created Intent data as Intent & FeeAmount type
  const [rawTx, intent] = createIntentResult.value;

  // create on-chain intent, post to Solver API and Submit to Relay API
  // IMPORTANT: you should primarily use this one to create and submit intent
  const createAndSubmitIntentResult = await sodax.solver.createAndSubmitIntent(
    mockCreateIntentParams,
    mockBscSpokeProvider,
    partnerFeeAmount,
  );

    if (!createAndSubmitIntentResult.ok) {
    // handle error
  }

  // txHash and created Intent data as Intent & FeeAmount type
  const [txHash, intent] = createIntentResult.value;
```

### Get Intent Order

Retrieve intent data using tx hash obtained from intent creation response.

```typescript
const intent = await sodax.solver.getIntent(txHash, hubProvider);
```

### Cancel Intent Order

Active Intent Order can be cancelled using Intent. See [Get Intent Order](#get-intent-order) on how to obtain intent.
**Note** create intent functions also return intent data for convenience.

```typescript

const result = await sodax.solver.cancelIntent(
  intent,
  bscSpokeProvider,
  hubProvider,
  false, // true = get raw transaction, false = execute and return tx hash
);
```

### Get Intent Status

Retrieve status of intent.

```typescript
const result = await sodax.solver.getStatus({
    intent_tx_hash: '0x...', // tx hash of create intent blockchain transaction
  } satisfies IntentStatusRequest);
```

### Get Intent Hash

Get Intent Hash (keccak256) used as an ID of intent in smart contract.

```typescript
const intentHash = sodax.solver.getIntentHash(intent);
```
