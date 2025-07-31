// packages/sdk/src/services/concentratedLiquidity/Planner.ts
import { type Address, encodeAbiParameters, type Hex } from 'viem';

// Action constants for PancakeSwap Infinity
export const Actions = {
  // cl-pool actions
  // liquidity actions
  CL_INCREASE_LIQUIDITY: 0x00,
  CL_DECREASE_LIQUIDITY: 0x01,
  CL_MINT_POSITION: 0x02,
  CL_BURN_POSITION: 0x03,
  CL_INCREASE_LIQUIDITY_FROM_DELTAS: 0x04,
  CL_MINT_POSITION_FROM_DELTAS: 0x05,
  // swapping
  CL_SWAP_EXACT_IN_SINGLE: 0x06,
  CL_SWAP_EXACT_IN: 0x07,
  CL_SWAP_EXACT_OUT_SINGLE: 0x08,
  CL_SWAP_EXACT_OUT: 0x09,
  // donate
  CL_DONATE: 0x0a,
  // closing deltas on the pool manager
  // settling
  SETTLE: 0x0b,
  SETTLE_ALL: 0x0c,
  SETTLE_PAIR: 0x0d,
  // taking
  TAKE: 0x0e,
  TAKE_ALL: 0x0f,
  TAKE_PORTION: 0x10,
  TAKE_PAIR: 0x11,
  CLOSE_CURRENCY: 0x12,
  CLEAR_OR_TAKE: 0x13,
  SWEEP: 0x14,
  WRAP: 0x15,
  UNWRAP: 0x16,
  // minting/burning 6909s to close deltas
  MINT_6909: 0x17,
  BURN_6909: 0x18,
  // bin-pool actions
  // liquidity actions
  BIN_ADD_LIQUIDITY: 0x19,
  BIN_REMOVE_LIQUIDITY: 0x1a,
  BIN_ADD_LIQUIDITY_FROM_DELTAS: 0x1b,
  // swapping
  BIN_SWAP_EXACT_IN_SINGLE: 0x1c,
  BIN_SWAP_EXACT_IN: 0x1d,
  BIN_SWAP_EXACT_OUT_SINGLE: 0x1e,
  BIN_SWAP_EXACT_OUT: 0x1f,
  // donate
  BIN_DONATE: 0x20,
} as const;

// Command constants for Universal Router
export const Commands = {
  // Masks to extract certain bits of commands
  FLAG_ALLOW_REVERT: 0x80,
  COMMAND_TYPE_MASK: 0x3f,

  // Command Types where value<=0x07, executed in the first nested-if block
  V3_SWAP_EXACT_IN: 0x00,
  V3_SWAP_EXACT_OUT: 0x01,
  PERMIT2_TRANSFER_FROM: 0x02,
  PERMIT2_PERMIT_BATCH: 0x03,
  SWEEP: 0x04,
  TRANSFER: 0x05,
  PAY_PORTION: 0x06,
  // COMMAND_PLACEHOLDER: 0x07,

  // Command Types where 0x08<=value<=0x0f, executed in the second nested-if block
  V2_SWAP_EXACT_IN: 0x08,
  V2_SWAP_EXACT_OUT: 0x09,
  PERMIT2_PERMIT: 0x0a,
  WRAP_ETH: 0x0b,
  UNWRAP_WETH: 0x0c,
  PERMIT2_TRANSFER_FROM_BATCH: 0x0d,
  BALANCE_CHECK_ERC20: 0x0e,
  // COMMAND_PLACEHOLDER: 0x0f,

  // Command Types where 0x10<=value<=0x20, executed in the third nested-if block
  INFI_SWAP: 0x10,
  V3_POSITION_MANAGER_PERMIT: 0x11,
  V3_POSITION_MANAGER_CALL: 0x12,
  INFI_CL_INITIALIZE_POOL: 0x13,
  INFI_BIN_INITIALIZE_POOL: 0x14,
  INFI_CL_POSITION_CALL: 0x15,
  INFI_BIN_POSITION_CALL: 0x16,
  // COMMAND_PLACEHOLDER: 0x17 -> 0x20,

  // Command Types where 0x21<=value<=0x3f
  EXECUTE_SUB_PLAN: 0x21,
  STABLE_SWAP_EXACT_IN: 0x22,
  STABLE_SWAP_EXACT_OUT: 0x23,
  // COMMAND_PLACEHOLDER: 0x24 -> 0x3f,
} as const;

// Action constants
export const ActionConstants = {
  // used to signal that an action should use the input value of the open delta on the vault
  // or of the balance that the contract holds
  OPEN_DELTA: 0n,
  // used to signal that an action should use the contract's entire balance of a currency
  // This value is equivalent to 1<<255, i.e. a singular 1 in the most significant bit.
  CONTRACT_BALANCE: 0x8000000000000000000000000000000000000000000000000000000000000000n,
  // used to signal that the recipient of an action should be the msgSender
  MSG_SENDER: '0x0000000000000000000000000000000000000001' as Address,
  // used to signal that the recipient of an action should be the address(this)
  ADDRESS_THIS: '0x0000000000000000000000000000000000000002' as Address,
} as const;

// PoolKey interface matching Solidity
export interface PoolKey {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  fee: number;
  parameters: `0x${string}`;
}

// Plan structure using hex strings instead of Uint8Array
export interface Plan {
  actions: Hex;
  params: Hex[];
}

export class Planner {
  public plan: Plan;

  constructor() {
    this.plan = {
      actions: '0x',
      params: [],
    };
  }

  /**
   * Initialize a new plan
   */
  static init(): Planner {
    return new Planner();
  }

  /**
   * Add an action to the plan - using hex strings for better TypeScript experience
   */
  add(action: number, param: Hex): Planner {
    // Add parameter to params array
    this.plan.params = [...this.plan.params, param];
    // Add action byte to actions hex string - actions are already hex values
    const actionHex = action.toString(16).padStart(2, '0');
    this.plan.actions = (this.plan.actions + actionHex) as Hex;
    return this;
  }

  /**
   * Finalize the plan for modify liquidity with close
   */
  finalizeModifyLiquidityWithClose(poolKey: PoolKey): Hex {
    this.add(Actions.CLOSE_CURRENCY, this.encodeAddress(poolKey.currency0));
    this.add(Actions.CLOSE_CURRENCY, this.encodeAddress(poolKey.currency1));
    return this.encode();
  }

  /**
   * Finalize the plan for modify liquidity with take
   */
  finalizeModifyLiquidityWithTake(poolKey: PoolKey, takeRecipient: Address): Hex {
    this.add(Actions.TAKE, this.encodeTakeParams(poolKey.currency0, takeRecipient, ActionConstants.OPEN_DELTA));
    this.add(Actions.TAKE, this.encodeTakeParams(poolKey.currency1, takeRecipient, ActionConstants.OPEN_DELTA));
    return this.encode();
  }

  /**
   * Finalize the plan for modify liquidity with settle pair
   */
  finalizeModifyLiquidityWithSettlePair(poolKey: PoolKey): Hex {
    this.add(Actions.SETTLE_PAIR, this.encodeSettlePairParams(poolKey.currency0, poolKey.currency1));
    return this.encode();
  }

  /**
   * Finalize the plan for modify liquidity with take pair
   */
  finalizeModifyLiquidityWithTakePair(poolKey: PoolKey, takeRecipient: Address): Hex {
    this.add(Actions.TAKE_PAIR, this.encodeTakePairParams(poolKey.currency0, poolKey.currency1, takeRecipient));
    return this.encode();
  }

  /**
   * Finalize the plan for swap
   */
  finalizeSwap(inputCurrency: Address, outputCurrency: Address, takeRecipient: Address): Hex {
    if (takeRecipient === ActionConstants.MSG_SENDER) {
      // blindly settling and taking all, without slippage checks, isn't recommended in prod
      this.add(Actions.SETTLE_ALL, this.encodeSettleAllParams(inputCurrency, ActionConstants.CONTRACT_BALANCE));
      this.add(Actions.TAKE_ALL, this.encodeTakeAllParams(outputCurrency, 0n));
    } else {
      this.add(Actions.SETTLE, this.encodeSettleParams(inputCurrency, ActionConstants.OPEN_DELTA, true));
      this.add(Actions.TAKE, this.encodeTakeParams(outputCurrency, takeRecipient, ActionConstants.OPEN_DELTA));
    }
    return this.encode();
  }

  /**
   * Encode the final plan using standard ABI encoding like Solidity
   */
  encode(): Hex {
    // Use viem's encodeAbiParameters to match Solidity's abi.encode(plan.actions, plan.params)
    const encoded = encodeAbiParameters(
      [
        { type: 'bytes', name: 'actions' },
        { type: 'bytes[]', name: 'params' },
      ],
      [this.plan.actions, this.plan.params],
    );

    return encoded;
  }

  /**
   * Helper method to encode address parameter
   */
  private encodeAddress(address: Address): Hex {
    return encodeAbiParameters([{ type: 'address', name: 'address' }], [address]);
  }

  /**
   * Helper method to encode take parameters
   */
  private encodeTakeParams(currency: Address, recipient: Address, delta: bigint): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency' },
        { type: 'address', name: 'recipient' },
        { type: 'uint256', name: 'delta' },
      ],
      [currency, recipient, delta],
    );
  }

  /**
   * Helper method to encode settle pair parameters
   */
  private encodeSettlePairParams(currency0: Address, currency1: Address): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency0' },
        { type: 'address', name: 'currency1' },
      ],
      [currency0, currency1],
    );
  }

  /**
   * Helper method to encode take pair parameters
   */
  private encodeTakePairParams(currency0: Address, currency1: Address, recipient: Address): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency0' },
        { type: 'address', name: 'currency1' },
        { type: 'address', name: 'recipient' },
      ],
      [currency0, currency1, recipient],
    );
  }

  /**
   * Helper method to encode settle all parameters
   */
  private encodeSettleAllParams(currency: Address, amount: bigint): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency' },
        { type: 'uint256', name: 'amount' },
      ],
      [currency, amount],
    );
  }

  /**
   * Helper method to encode take all parameters
   */
  private encodeTakeAllParams(currency: Address, amount: bigint): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency' },
        { type: 'uint256', name: 'amount' },
      ],
      [currency, amount],
    );
  }

  /**
   * Helper method to encode settle parameters
   */
  private encodeSettleParams(currency: Address, delta: bigint, useTry: boolean): Hex {
    return encodeAbiParameters(
      [
        { type: 'address', name: 'currency' },
        { type: 'uint256', name: 'delta' },
        { type: 'bool', name: 'useTry' },
      ],
      [currency, delta, useTry],
    );
  }
}
