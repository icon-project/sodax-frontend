# Example Node App

This is an example node app that demonstrates how to use the New World SDK in node.js environment.

## Prerequisites

- Node.js v18+
- pnpm
- Private key of the account to use for the transactions

## Before running the app

1. Build the SDK

```bash
cd packages/sdk // make sure you are in the sdk package
pnpm build      // build the sdk
```

2. Install dependencies

```bash
cd apps/node // make sure you are in the node app folder
pnpm install // install the dependencies
```

3. Create a `.env` file in the root of the project and add the private key of the account to use for the transactions

```bash
PRIVATE_KEY=<private_key>
```

## Running the app

```bash
pnpm run dev
```

## Examples

```bash
pnpm run dev moneymarket <user_address>
```

```bash
pnpm cosmos borrow <token> <amount>
```

```bash
pnpm cosmos supply <token> <amount>
```


