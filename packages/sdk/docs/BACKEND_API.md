# Backend API Service Documentation

The BackendApiService provides a comprehensive interface to interact with the Sodax Backend API, offering access to Intent, Solver, and Money Market data. This service is automatically initialized when creating a Sodax instance and can be accessed through the `backendApiService` property.

## Table of Contents

- [Initialization](#initialization)
- [Configuration](#configuration)
- [Intent Endpoints](#intent-endpoints)
- [Solver Endpoints](#solver-endpoints)
- [Money Market Endpoints](#money-market-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Initialization

The BackendApiService is automatically initialized when creating a Sodax instance. You can configure it by passing a `backendApiConfig` in the Sodax constructor.

### Basic Initialization

```typescript
import { Sodax } from '@sodax/sdk';

// Initialize with default configuration
const sodax = new Sodax();
const backendApi = sodax.backendApi;
```

### Custom Configuration

```typescript
import { Sodax } from '@sodax/sdk';

const sodax = new Sodax({
  backendApiConfig: {
    baseURL: 'https://your-custom-api-endpoint.com',
    timeout: 60000, // 60 seconds
    headers: {
      'Authorization': 'Bearer your-token',
      'X-Custom-Header': 'custom-value'
    }
  }
});

const backendApi = sodax.backendApi;
```

## Configuration

### BackendApiConfig Type

```typescript
type BackendApiConfig = {
  baseURL?: HttpUrl;           // API endpoint URL (default: 'https://api.sodax.com/v1/be')
  timeout?: number;            // Request timeout in milliseconds (default: 30000)
  headers?: Record<string, string>; // Custom headers (default: Content-Type and Accept)
}
```

### Default Configuration

```typescript
const DEFAULT_BACKEND_API_ENDPOINT = 'https://api.sodax.com/v1/be';
const DEFAULT_BACKEND_API_TIMEOUT = 30000; // 30 seconds
const DEFAULT_BACKEND_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
```

## Intent Endpoints

### Get Intent by Transaction Hash

Retrieves intent details using a transaction hash.

```typescript
const intent = await sodax.backendApi.getIntentByTxHash('0x123...abc');
```

**Request:**
- **Method:** GET
- **Endpoint:** `/intent/tx/{txHash}`
- **Parameters:** `txHash` (string) - The transaction hash

**Response:**
```typescript
interface IntentResponse {
  intentHash: string;
  txHash: string;
  logIndex: number;
  chainId: number;
  blockNumber: number;
  open: boolean;
  intent: {
    intentId: string;
    creator: string;
    inputToken: string;
    outputToken: string;
    inputAmount: string;
    minOutputAmount: string;
    deadline: string;
    allowPartialFill: boolean;
    srcChain: number;
    dstChain: number;
    srcAddress: string;
    dstAddress: string;
    solver: string;
    data: string;
  };
  events: unknown[];
}
```

**Example Response:**
```json
{
  "intentHash": "0x456...def",
  "txHash": "0x123...abc",
  "logIndex": 0,
  "chainId": 146,
  "blockNumber": 12345678,
  "open": true,
  "intent": {
    "intentId": "intent_123",
    "creator": "0x789...ghi",
    "inputToken": "0xabc...123",
    "outputToken": "0xdef...456",
    "inputAmount": "1000000000000000000",
    "minOutputAmount": "950000000000000000",
    "deadline": "1700000000",
    "allowPartialFill": true,
    "srcChain": 146,
    "dstChain": 1,
    "srcAddress": "0x789...ghi",
    "dstAddress": "0x789...ghi",
    "solver": "0x000...000",
    "data": "0x"
  },
  "events": []
}
```

### Get Intent by Intent Hash

Retrieves intent details using an intent hash.

```typescript
const intent = await sodax.backendApi.getIntentByHash('0x456...def');
```

**Request:**
- **Method:** GET
- **Endpoint:** `/intent/{intentHash}`
- **Parameters:** `intentHash` (string) - The intent hash

**Response:** Same as `getIntentByTxHash`

## Solver Endpoints

### Get Orderbook

Retrieves the solver orderbook with pagination support.

```typescript
const orderbook = await sodax.backendApi.getOrderbook({
  offset: '0',
  limit: '10'
});
```

**Request:**
- **Method:** GET
- **Endpoint:** `/solver/orderbook?offset={offset}&limit={limit}`
- **Parameters:**
  - `offset` (string) - Starting position for pagination
  - `limit` (string) - Maximum number of items to return

**Response:**
```typescript
interface OrderbookResponse {
  total: number;
  data: Array<{
    intentState: {
      exists: boolean;
      remainingInput: string;
      receivedOutput: string;
      pendingPayment: boolean;
    };
    intentData: {
      intentId: string;
      creator: string;
      inputToken: string;
      outputToken: string;
      inputAmount: string;
      minOutputAmount: string;
      deadline: string;
      allowPartialFill: boolean;
      srcChain: number;
      dstChain: number;
      srcAddress: string;
      dstAddress: string;
      solver: string;
      data: string;
      intentHash: string;
      txHash: string;
      blockNumber: number;
    };
  }>;
}
```

**Example Response:**
```json
{
  "total": 25,
  "data": [
    {
      "intentState": {
        "exists": true,
        "remainingInput": "1000000000000000000",
        "receivedOutput": "0",
        "pendingPayment": false
      },
      "intentData": {
        "intentId": "intent_123",
        "creator": "0x789...ghi",
        "inputToken": "0xabc...123",
        "outputToken": "0xdef...456",
        "inputAmount": "1000000000000000000",
        "minOutputAmount": "950000000000000000",
        "deadline": "1700000000",
        "allowPartialFill": true,
        "srcChain": 146,
        "dstChain": 1,
        "srcAddress": "0x789...ghi",
        "dstAddress": "0x789...ghi",
        "solver": "0x000...000",
        "data": "0x",
        "intentHash": "0x456...def",
        "txHash": "0x123...abc",
        "blockNumber": 12345678
      }
    }
  ]
}
```

## Money Market Endpoints

### Get User Position

Retrieves money market position for a specific user.

```typescript
const position = await sodax.backendApi.getMoneyMarketPosition('0x789...ghi');
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/position/{userAddress}`
- **Parameters:** `userAddress` (string) - User's wallet address

**Response:**
```typescript
interface MoneyMarketPosition {
  userAddress: string;
  positions: Array<{
    reserveAddress: string;
    aTokenAddress: string;
    variableDebtTokenAddress: string;
    aTokenBalance: string;
    variableDebtTokenBalance: string;
    blockNumber: number;
  }>;
}
```

**Example Response:**
```json
{
  "userAddress": "0x789...ghi",
  "positions": [
    {
      "reserveAddress": "0xabc...123",
      "aTokenAddress": "0xdef...456",
      "variableDebtTokenAddress": "0xghi...789",
      "aTokenBalance": "5000000000000000000",
      "variableDebtTokenBalance": "1000000000000000000",
      "blockNumber": 12345678
    }
  ]
}
```

### Get All Money Market Assets

Retrieves all available money market assets.

```typescript
const assets = await sodax.backendApi.getAllMoneyMarketAssets();
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/asset/all`

**Response:**
```typescript
interface MoneyMarketAsset {
  reserveAddress: string;
  aTokenAddress: string;
  totalATokenBalance: string;
  variableDebtTokenAddress: string;
  totalVariableDebtTokenBalance: string;
  liquidityRate: string;
  symbol: string;
  totalSuppliers: number;
  totalBorrowers: number;
  variableBorrowRate: string;
  stableBorrowRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  blockNumber: number;
}
```

**Example Response:**
```json
[
  {
    "reserveAddress": "0xabc...123",
    "aTokenAddress": "0xdef...456",
    "totalATokenBalance": "1000000000000000000000",
    "variableDebtTokenAddress": "0xghi...789",
    "totalVariableDebtTokenBalance": "500000000000000000000",
    "liquidityRate": "500000000000000000",
    "symbol": "USDC",
    "totalSuppliers": 150,
    "totalBorrowers": 75,
    "variableBorrowRate": "800000000000000000",
    "stableBorrowRate": "600000000000000000",
    "liquidityIndex": "1000000000000000000000000000",
    "variableBorrowIndex": "1000000000000000000000000000",
    "blockNumber": 12345678
  }
]
```

### Get Specific Money Market Asset

Retrieves details for a specific money market asset.

```typescript
const asset = await sodax.backendApi.getMoneyMarketAsset('0xabc...123');
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/asset/{reserveAddress}`
- **Parameters:** `reserveAddress` (string) - Reserve contract address

**Response:** Same as `MoneyMarketAsset` interface

### Get Asset Borrowers

Retrieves borrowers for a specific money market asset with pagination.

```typescript
const borrowers = await sodax.backendApi.getMoneyMarketAssetBorrowers(
  '0xabc...123',
  { offset: '0', limit: '10' }
);
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/asset/{reserveAddress}/borrowers?offset={offset}&limit={limit}`
- **Parameters:**
  - `reserveAddress` (string) - Reserve contract address
  - `offset` (string) - Starting position for pagination
  - `limit` (string) - Maximum number of items to return

**Response:**
```typescript
interface MoneyMarketAssetBorrowers {
  borrowers: string[];
  total: number;
  offset: number;
  limit: number;
}
```

**Example Response:**
```json
{
  "borrowers": [
    "0x789...ghi",
    "0xabc...def",
    "0x123...456"
  ],
  "total": 75,
  "offset": 0,
  "limit": 10
}
```

### Get Asset Suppliers

Retrieves suppliers for a specific money market asset with pagination.

```typescript
const suppliers = await sodax.backendApi.getMoneyMarketAssetSuppliers(
  '0xabc...123',
  { offset: '0', limit: '10' }
);
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/asset/{reserveAddress}/suppliers?offset={offset}&limit={limit}`
- **Parameters:**
  - `reserveAddress` (string) - Reserve contract address
  - `offset` (string) - Starting position for pagination
  - `limit` (string) - Maximum number of items to return

**Response:**
```typescript
interface MoneyMarketAssetSuppliers {
  suppliers: string[];
  total: number;
  offset: number;
  limit: number;
}
```

**Example Response:**
```json
{
  "suppliers": [
    "0x789...ghi",
    "0xabc...def",
    "0x123...456"
  ],
  "total": 150,
  "offset": 0,
  "limit": 10
}
```

### Get All Money Market Borrowers

Retrieves all money market borrowers with pagination.

```typescript
const allBorrowers = await sodax.backendApi.getAllMoneyMarketBorrowers({
  offset: '0',
  limit: '10'
});
```

**Request:**
- **Method:** GET
- **Endpoint:** `/moneymarket/borrowers?offset={offset}&limit={limit}`
- **Parameters:**
  - `offset` (string) - Starting position for pagination
  - `limit` (string) - Maximum number of items to return

**Response:**
```typescript
interface MoneyMarketBorrowers {
  borrowers: string[];
  total: number;
  offset: number;
  limit: number;
}
```

## Error Handling

The BackendApiService includes comprehensive error handling for various scenarios:

### Timeout Errors
```typescript
try {
  const result = await sodax.backendApi.getOrderbook({ offset: '0', limit: '10' });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Request timed out after 30 seconds');
  }
}
```

### HTTP Errors
```typescript
try {
  const result = await sodax.backendApi.getIntentByTxHash('invalid-hash');
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.error('Intent not found');
  } else if (error.message.includes('HTTP 500')) {
    console.error('Server error');
  }
}
```

### Network Errors
```typescript
try {
  const result = await sodax.backendApi.getAllMoneyMarketAssets();
} catch (error) {
  console.error('Network error:', error.message);
}
```

## Utility Methods

### Set Custom Headers

You can dynamically set custom headers for API requests:

```typescript
sodax.backendApi.setHeaders({
  'Authorization': 'Bearer new-token',
  'X-Custom-Header': 'custom-value'
});
```

### Get Base URL

Retrieve the current base URL being used:

```typescript
const baseURL = sodax.backendApi.getBaseURL();
console.log('API Base URL:', baseURL);
```

## Complete Example

Here's a complete example showing how to use the BackendApiService:

```typescript
import { Sodax } from '@sodax/sdk';

async function example() {
  // Initialize Sodax with custom backend API configuration
  const sodax = new Sodax({
    backendApiConfig: {
      baseURL: 'https://api.sodax.com/v1/be',
      timeout: 60000,
      headers: {
        'Authorization': 'Bearer your-api-token'
      }
    }
  });

  try {
    // Get solver orderbook
    const orderbook = await sodax.backendApi.getOrderbook({
      offset: '0',
      limit: '5'
    });
    console.log('Orderbook:', orderbook);

    // Get user's money market position
    const userAddress = '0x789...ghi';
    const position = await sodax.backendApi.getMoneyMarketPosition(userAddress);
    console.log('User Position:', position);

    // Get all money market assets
    const assets = await sodax.backendApi.getAllMoneyMarketAssets();
    console.log('Available Assets:', assets);

    // Get intent by transaction hash
    const txHash = '0x123...abc';
    const intent = await sodax.backendApi.getIntentByTxHash(txHash);
    console.log('Intent Details:', intent);

  } catch (error) {
    console.error('API Error:', error.message);
  }
}

example();
```

## Notes

- All string amounts in responses are in wei format (18 decimals)
- Pagination parameters (`offset` and `limit`) are strings, not numbers
- The service automatically handles request timeouts and retries
- All endpoints return JSON responses
- Error messages include HTTP status codes for better debugging
