import { describe, it, expect, vi } from 'vitest';
import { Cl, type ClarityValue } from '@stacks/transactions';
import { StacksRawSpokeProvider } from '../../entities/stacks/StacksSpokeProvider.js';
import { StacksSpokeService } from './StacksSpokeService.js';
import { spokeChainConfig } from '@sodax/types';
import { STACKS_MAINNET_CHAIN_ID, type StacksSpokeChainConfig } from '@sodax/types';
import type { Hex } from 'viem';

// `StacksRawTransaction` in shared/types.ts is intentionally loose
// (`{[key: string]: string | object | number}`) to satisfy the union return
// type of SpokeService.deposit. The actual shape is well-defined though, so
// we narrow it locally for the assertions below.
type StacksReqData = {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditionMode: number;
};

// Snapshot test for the exact `reqData` payload that StacksSpokeService.deposit
// passes to the wallet (Xverse) for signing. This is the very last point at
// which #1070's c32check fix could drift from @stacks/transactions output —
// any byte difference here would mean a different on-chain tx, possibly
// targeting the wrong contract or sending to the wrong recipient.
//
// The expected hex strings below were captured from a real swap on `main`
// (PR #1074 lazy-load fix) and verified byte-for-byte against the same swap
// on this branch. Both branches produce identical reqData modulo:
//   - intentId  (random uint256, lives inside `data`)
//   - deadline  (time-dependent, inside `data`)
//   - quote     (block-dependent, inside `data`)
//
// Inputs here are deterministic (no random, no time, no quote), so the test
// is fully reproducible.

describe('StacksSpokeService.deposit (raw mode) — reqData snapshot for #1070', () => {
  const stacksConfig = spokeChainConfig[STACKS_MAINNET_CHAIN_ID] as StacksSpokeChainConfig;
  const userAddress = 'SP1K8PCE9CDDKKQYH7PPKPNACY0A12NS1Z9GJE6TK';

  // Fixed inputs we control
  const FIXED_RECIPIENT_HUB: Hex = '0x54980E4f826a77e942a5f4D891A758c23009DC8D'; // hub wallet derived for userAddress
  const FIXED_AMOUNT = 1_000_000n; // 1 STX (6 decimals)
  const FIXED_DATA: Hex = '0x'; // simplest case — no cross-chain payload
  // Mock impl address — production reads this via RPC, we hardcode for determinism
  const MOCK_IMPL = 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl' as const;

  function makeRawProvider() {
    const provider = new StacksRawSpokeProvider(userAddress, stacksConfig);
    // Skip the Stacks RPC call — production fetches the impl address via
    // walletReadContract, which would require a network round-trip.
    vi.spyOn(provider, 'getImplContractAddress').mockResolvedValue(MOCK_IMPL);
    return provider;
  }

  // StacksSpokeService.deposit always derives the userWallet via
  // EvmWalletAbstraction.getUserHubWalletAddress before falling back to
  // params.to, so we need a stub hubProvider whose publicClient.readContract
  // resolves. The returned value is unused because every test passes
  // params.to explicitly.
  const mockHubProvider = {
    publicClient: {
      readContract: vi.fn().mockResolvedValue('0x0000000000000000000000000000000000000000'),
    },
    chainConfig: { addresses: { hubWallet: '0x0000000000000000000000000000000000000000' } },
    // biome-ignore lint/suspicious/noExplicitAny: minimal stub satisfying the EvmHubProvider shape we touch
  } as any;

  it('STX native deposit produces expected reqData', async () => {
    const provider = makeRawProvider();

    const reqData = await StacksSpokeService.deposit(
      {
        from: userAddress as `0x${string}`,
        token: stacksConfig.nativeToken, // 'ST000…nativetoken' → noneCV branch
        amount: FIXED_AMOUNT,
        data: FIXED_DATA,
        to: FIXED_RECIPIENT_HUB,
      },
      provider,
      mockHubProvider,
      true, // raw mode
    );

    // Top-level shape
    const tx = reqData as unknown as StacksReqData;
    expect(tx.contractAddress).toBe('SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0');
    expect(tx.contractName).toBe('asset-manager-impl');
    expect(tx.functionName).toBe('transfer');
    expect(tx.functionArgs).toHaveLength(5);
    expect(tx.postConditionMode).toBe(1); // PostConditionMode.Allow

    // Serialize each function arg to hex and compare with byte-for-byte
    // expected values captured from main branch reqData log.
    const serialized = tx.functionArgs.map((a: ClarityValue) => Cl.serialize(a));

    // arg0: NoneCV (token = STX native)
    expect(serialized[0]).toBe('09');

    // arg1: BufferCV(recipient hub address) — 20 bytes
    expect(serialized[1]).toBe('020000001454980e4f826a77e942a5f4d891a758c23009dc8d');

    // arg2: UIntCV(1_000_000)
    expect(serialized[2]).toBe('01000000000000000000000000000f4240');

    // arg3: BufferCV(0x — empty data)
    expect(serialized[3]).toBe('0200000000');

    // arg4: ContractPrincipalCV(connection-v3) — exact bytes from live Xverse
    // reqData on both main and fix branches.
    expect(serialized[4]).toBe('0616c030e21338c86199889c382f1cda75d7adf4a9b90d636f6e6e656374696f6e2d7633');
  });

  it('SIP-10 token deposit (sBTC) wraps token in someCV(Cl.principal(...))', async () => {
    const provider = makeRawProvider();
    const sBTCAddress = stacksConfig.supportedTokens.sBTC?.address;
    if (!sBTCAddress) throw new Error('sBTC not in stacks config');

    const reqData = await StacksSpokeService.deposit(
      {
        from: userAddress as `0x${string}`,
        token: sBTCAddress, // 'SM3VDX…sbtc-token' → someCV branch
        amount: FIXED_AMOUNT,
        data: FIXED_DATA,
        to: FIXED_RECIPIENT_HUB,
      },
      provider,
      mockHubProvider,
      true,
    );

    const tx = reqData as unknown as StacksReqData;
    const serialized = tx.functionArgs.map((a: ClarityValue) => Cl.serialize(a));

    // arg0: SomeCV(ContractPrincipal(sbtc-token))
    //   0a       = OptionalSome wrapper
    //   06       = ContractPrincipal
    //   14       = mainnet p2sh version 0x14 (SM addresses)
    //   f6decc7cfff2a413bd7cd4f53c25ad7fd1899acc = hash160 of SM3VDX…
    //   0a       = length 10
    //   736274632d746f6b656e = 'sbtc-token'
    expect(serialized[0]).toBe('0a0614f6decc7cfff2a413bd7cd4f53c25ad7fd1899acc0a736274632d746f6b656e');

    // Other args identical to STX case (recipient/amount/data/connection)
    expect(serialized[1]).toBe('020000001454980e4f826a77e942a5f4d891a758c23009dc8d');
    expect(serialized[2]).toBe('01000000000000000000000000000f4240');
    expect(serialized[3]).toBe('0200000000');
    expect(serialized[4]).toBe('0616c030e21338c86199889c382f1cda75d7adf4a9b90d636f6e6e656374696f6e2d7633');
  });

  // Cover every Stacks token in the Sodax config — each is a contract
  // principal with a different deployer hash160 + contract name. If
  // serializeAddressData / Cl.principal ever drift on any of these, the
  // resulting on-chain transfer would target the wrong asset.
  it.each([
    {
      name: 'bnUSD',
      token: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.bnusd',
      // SP3031… deployer + 'bnusd' (5 bytes)
      expected: '0a0616c030e21338c86199889c382f1cda75d7adf4a9b905626e757364',
    },
    {
      name: 'SODA',
      token: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.soda',
      // same deployer, 'soda' (4 bytes)
      expected: '0a0616c030e21338c86199889c382f1cda75d7adf4a9b904736f6461',
    },
    {
      name: 'USDC',
      token: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
      // SP120SBR… different deployer hash160, 'usdcx' (5 bytes)
      expected: '0a0616440caf0bbc800a33993ea85c2392aeb53696608b057573646378',
    },
  ])('SIP-10 token deposit ($name) serializes contract principal correctly', async ({ token, expected }) => {
    const provider = makeRawProvider();

    const reqData = await StacksSpokeService.deposit(
      {
        from: userAddress as `0x${string}`,
        token,
        amount: FIXED_AMOUNT,
        data: FIXED_DATA,
        to: FIXED_RECIPIENT_HUB,
      },
      provider,
      mockHubProvider,
      true,
    );

    const tx = reqData as unknown as StacksReqData;
    const serialized = tx.functionArgs.map((a: ClarityValue) => Cl.serialize(a));
    expect(serialized[0]).toBe(expected);
    // Other args identical to STX/sBTC cases
    expect(serialized[1]).toBe('020000001454980e4f826a77e942a5f4d891a758c23009dc8d');
    expect(serialized[2]).toBe('01000000000000000000000000000f4240');
    expect(serialized[3]).toBe('0200000000');
    expect(serialized[4]).toBe('0616c030e21338c86199889c382f1cda75d7adf4a9b90d636f6e6e656374696f6e2d7633');
  });

  it('non-empty data buffer is preserved byte-for-byte', async () => {
    const provider = makeRawProvider();
    const cross_chain_payload: Hex = '0xdeadbeef';

    const reqData = await StacksSpokeService.deposit(
      {
        from: userAddress as `0x${string}`,
        token: stacksConfig.nativeToken,
        amount: FIXED_AMOUNT,
        data: cross_chain_payload,
        to: FIXED_RECIPIENT_HUB,
      },
      provider,
      mockHubProvider,
      true,
    );

    const tx = reqData as unknown as StacksReqData;
    const serialized = tx.functionArgs.map((a: ClarityValue) => Cl.serialize(a));
    // arg3: BufferCV(0xdeadbeef) — length 4
    expect(serialized[3]).toBe('0200000004deadbeef');
  });
});
