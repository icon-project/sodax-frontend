[![CI](https://github.com/icon-project/sodax-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/icon-project/sodax-frontend/actions/workflows/ci.yml)

# Sodax Frontend

This repository contains the frontend and libraries implementation for the Sodax project, built with a modern tech stack and monorepo architecture.

If you want to contribute, please refer to the [contributing guidelines](./CONTRIBUTING.md) of this project.

## Repository Structure

### Apps (`/apps`)

The `apps` directory contains various frontend applications:

- **web** (`/apps/web`): Main Next.js web application
- **demo** (`/apps/demo`): Demo application showcasing features
- **node** (`/apps/node`): Node.js specific implementation
- **react-solver-example** (`/apps/react-solver-example`): Example implementation of the solver

### SDK's (`/packages`)

The `packages` directory contains a sdk's and libraries:

- **sdk** (`/packages/sdk`): The core SDK that exposes the full suite of Sodax features through a streamlined set of interfaces and functions. For wallet integration, developers can either implement the provided wallet provider interfaces or utilize the optional wallet-sdk SDK for a more comprehensive solution. [Sodax SDK Documentation](./packages/sdk/README.md).
- **wallet-sdk-react** (`/packages/wallet-sdk-react`): A dedicated Wallet Connectivity SDK that supports multi-chain wallet operations, including transaction signing, broadcasting, and retrieval. It is fully compliant with the Sodax SDK wallet provider interface specifications, ensuring seamless integration. [Wallet SDK Documentation](./packages/wallet-sdk-react/README.md).
- **dapp-kit** (`/packages/dapp-kit`): A utility kit optimized for React and Next.js applications, leveraging both the wallet-sdk and Sodax SDKs. It offers a collection of hooks, components, and utilities designed to accelerate frontend dApp development with modular, production-ready building blocks. [dApp Kit Documentation](./packages/dapp-kit/README.md).

### Publishing SDK's

Instruction on how to release new packages can be found in [RELEASE_INSTRUCTIONS.md](./packages/RELEASE_INSTRUCTIONS.md)

### Git Flow Frontend

branches: `main`, `staging`, `production`:
- `main` - https://sodax-web-dev.vercel.app/
- `staging` - https://sodax-web-staging.vercel.app/
- `production` - https://sodax.com/

for normal task:
1. create a branch from main
2. create a PR from the branch to main, the PR is merged into main by the reviewer
3. after testing sodax-web-dev.vercel.app by the QA, main merged into staging
4. after testing sodax-web-staging.vercel.app by the QA, staging merged into production

for urgent task:
1. create a new branch from production
2. create a PR from the branch to production, after testing by the QA or dev, the PR is merged into production
3. make a PR from production to main to sync the latest changes between production and main


rules for merging:
1. when merge feature branches to main, use squash merge
2. when merge main into staging, use normal merge
3. when merge staging into production, use normal merge.
