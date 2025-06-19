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
- **wallet-sdk** (`/packages/wallet-sdk`): A dedicated Wallet Connectivity SDK that supports multi-chain wallet operations, including transaction signing, broadcasting, and retrieval. It is fully compliant with the Sodax SDK wallet provider interface specifications, ensuring seamless integration. [Wallet SDK Documentation](./packages/wallet-sdk/README.md).
- **dapp-kit** (`/packages/dapp-kit`): A utility kit optimized for React and Next.js applications, leveraging both the wallet-sdk and Sodax SDKs. It offers a collection of hooks, components, and utilities designed to accelerate frontend dApp development with modular, production-ready building blocks. [Dapp Kit Documentation](./packages/dapp-kit/README.md).