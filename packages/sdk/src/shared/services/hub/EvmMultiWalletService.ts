import {
  type Address,
  type PublicClient,
  type HttpTransport,
  type Hex,
  encodeFunctionData,
  keccak256,
  encodePacked,
  getContractAddress,
  getAddress,
} from 'viem';

import type { EvmContractCall } from '../../types.js';
import type { IEvmWalletProvider } from '@sodax/types';
import { multiHubWalletManagerAbi } from '../../abis/multiHubWalletManager.abi.js';
import { unifiedWalletAbi } from '../../abis/unifiedWallet.abi.js';
import { getHubChainConfig } from '../../config/ConfigService.js';

export class EvmMultiWalletService {
  private constructor() {}

  // =========================================================
  //                 CREATE WALLET
  // =========================================================

  public static get multiHubWalletManagerAddress(): Address {
    return getHubChainConfig().addresses.multiHubWalletManager;
  }

  /** Execute tx */
  public static async createWallet(
    tag: Hex,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const manager = this.multiHubWalletManagerAddress;
    const call = this.encodeCreateWallet(manager, tag);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  /** Encode only */
  public static encodeCreateWallet(manager: Address, tag: Hex): EvmContractCall {
    return {
      address: manager,
      value: 0n,
      data: encodeFunctionData({
        abi: multiHubWalletManagerAbi,
        functionName: 'createWallet',
        args: [tag],
      }),
    };
  }

  // =========================================================
  //                 REGISTER WALLET
  // =========================================================

  public static async registerWallet(
    wallet: Address,
    tag: Hex,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeRegisterWallet(wallet, tag);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeRegisterWallet(
    wallet: Address,
    tag: Hex,
  ): EvmContractCall {
    const manager = this.multiHubWalletManagerAddress;
    return {
      address: manager,
      value: 0n,
      data: encodeFunctionData({
        abi: multiHubWalletManagerAbi,
        functionName: 'registerWallet',
        args: [wallet, tag],
      }),
    };
  }

  // =========================================================
  //                 UNREGISTER WALLET
  // =========================================================

  public static async unregisterWallet(
    wallet: Address,
    tag: Hex,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeUnregisterWallet(wallet, tag);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeUnregisterWallet(
    wallet: Address,
    tag: Hex,
  ): EvmContractCall {
    const manager = this.multiHubWalletManagerAddress;
    return {
      address: manager,
      value: 0n,
      data: encodeFunctionData({
        abi: multiHubWalletManagerAbi,
        functionName: 'unregisterWallet',
        args: [wallet, tag],
      }),
    };
  }

  // =========================================================
  //                 UPDATE WALLET TAG
  // =========================================================

  public static async updateWalletTag(
    wallet: Address,
    oldTag: Hex,
    newTag: Hex,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeUpdateWalletTag(wallet, oldTag, newTag);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeUpdateWalletTag(
    wallet: Address,
    oldTag: Hex,
    newTag: Hex,
  ): EvmContractCall {
    const manager = this.multiHubWalletManagerAddress;
    return {
      address: manager,
      value: 0n,
      data: encodeFunctionData({
        abi: multiHubWalletManagerAbi,
        functionName: 'updateWalletTag',
        args: [wallet, oldTag, newTag],
      }),
    };
  }

  // =========================================================
  //                 ADD OWNER
  // =========================================================

  public static async addOwner(
    wallet: Address,
    owner: Address,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeAddOwner(wallet, owner);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeAddOwner(wallet: Address, owner: Address): EvmContractCall {
    return {
      address: wallet,
      value: 0n,
      data: encodeFunctionData({
        abi: unifiedWalletAbi,
        functionName: 'addOwner',
        args: [owner],
      }),
    };
  }

  // =========================================================
  //                 REMOVE OWNER
  // =========================================================

  public static async removeOwner(
    wallet: Address,
    owner: Address,
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeRemoveOwner(wallet, owner);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeRemoveOwner(
    wallet: Address,
    owner: Address,
  ): EvmContractCall {
    return {
      address: wallet,
      value: 0n,
      data: encodeFunctionData({
        abi: unifiedWalletAbi,
        functionName: 'removeOwner',
        args: [owner],
      }),
    };
  }

  // =========================================================
  //                 EXECUTE BATCH
  // =========================================================

  public static async executeBatch(
    wallet: Address,
    calls: readonly { addr: Address; value: bigint; data: Hex }[],
    provider: IEvmWalletProvider,
  ) {
    const from = await provider.getWalletAddress();
    const call = this.encodeExecuteBatch(wallet, calls);

    return provider.sendTransaction({
      from,
      to: call.address,
      value: call.value,
      data: call.data,
    });
  }

  public static encodeExecuteBatch(
    wallet: Address,
    calls: readonly { addr: Address; value: bigint; data: Hex }[],
  ): EvmContractCall {
    return {
      address: wallet,
      value: 0n,
      data: encodeFunctionData({
        abi: unifiedWalletAbi,
        functionName: 'executeBatch',
        args: [calls],
      }),
    };
  }

  // =========================================================
  //                 READ OPERATIONS
  // =========================================================

/**
 * Returns ALL wallets ever created by a user by reconstructing deterministic clone addresses.
 */
static async getWalletsOf(
  user: Address,
  publicClient: PublicClient<HttpTransport>,
): Promise<readonly Address[]> {
  const manager = this.multiHubWalletManagerAddress;
  // 1. Fetch walletCount[user]
  const walletCount = await publicClient.readContract({
    address: manager,
    abi: multiHubWalletManagerAbi,
    functionName: 'walletCount',
    args: [user],
  }) as bigint;

  // 2. Fetch wallet implementation
  const implementation = await publicClient.readContract({
    address: manager,
    abi: multiHubWalletManagerAbi,
    functionName: 'walletImplementation',
    args: [],
  }) as Address;

  const managerAddress = manager; // deterministic deployer

  const wallets: Address[] = [];

  for (let i = 0n; i < walletCount; i++) {
    const salt = keccak256(
      encodePacked(['address', 'uint256'], [user, i])
    );

    const predicted = getContractAddress({
      from: managerAddress,
      salt,
      bytecodeHash: keccak256(`0x${implementation.replace('0x', '')}`),
      opcode: 'CREATE2',
    });

    wallets.push(getAddress(predicted));
  }

  return wallets;
}

  static async getWalletsOfByTag(
    user: Address,
    tag: Hex,
    publicClient: PublicClient<HttpTransport>,
  ) {
    
    const manager = this.multiHubWalletManagerAddress;
    return publicClient.readContract({
      address: manager,
      abi: multiHubWalletManagerAbi,
      functionName: 'getWalletsOfByTag',
      args: [user, tag],
    }) as Promise<readonly Address[]>;
  }

  static async getAllWalletsOf(
    user: Address,
    tags: readonly Hex[],
    publicClient: PublicClient<HttpTransport>,
  ) {
    const manager = this.multiHubWalletManagerAddress;
    const all = await Promise.all(
      tags.map((tag) =>
        publicClient.readContract({
          address: manager,
          abi: multiHubWalletManagerAbi,
          functionName: 'getWalletsOfByTag',
          args: [user, tag],
        }),
      ),
    );

    return all.flat() as readonly Address[];
  }

  static async getOwners(
    wallet: Address,
    publicClient: PublicClient<HttpTransport>,
  ) {
    return publicClient.readContract({
      address: wallet,
      abi: unifiedWalletAbi,
      functionName: 'getOwners',
      args: [],
    }) as Promise<readonly Address[]>;
  }

  static async isOwner(
    wallet: Address,
    user: Address,
    publicClient: PublicClient<HttpTransport>,
  ) {
    return publicClient.readContract({
      address: wallet,
      abi: unifiedWalletAbi,
      functionName: 'isOwner',
      args: [user],
    }) as Promise<boolean>;
  }
}
