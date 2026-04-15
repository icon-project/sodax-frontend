/**
 * Bundled re-exports of @stacks/transactions and @stacks/network.
 *
 * TODO(#1070): These packages are bundled here via tsup `noExternal` to work
 * around a Turbopack scope-hoisting cycle that crashes Next.js 16 builds.
 * Consumers (sdk, wallet-sdk-core, wallet-sdk-react) import from
 * `@sodax/libs/stacks` so the code is bundled only once across the chain.
 *
 * Remove this package and revert consumers to `@stacks/*` imports when the
 * upstream cycle is fixed.
 */

// @stacks/transactions — values
export {
  Cl,
  serializeCV,
  someCV,
  uintCV,
  noneCV,
  parseContractId,
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  makeSTXTokenTransfer,
  PostConditionMode,
} from '@stacks/transactions';

// @stacks/transactions — types
export type {
  ClarityValue,
  ContractIdString,
  ContractPrincipalCV,
  UIntCV,
  ResponseOkCV,
  PostConditionModeName,
  PostCondition,
} from '@stacks/transactions';

// @stacks/network — values
export { createNetwork, networkFrom } from '@stacks/network';

// @stacks/network — types
export type { StacksNetwork } from '@stacks/network';
