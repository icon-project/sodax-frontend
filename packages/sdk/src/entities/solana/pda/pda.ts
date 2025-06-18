import { PublicKey } from '@solana/web3.js';
import type BN from 'bn.js';

export const RateLimitPDA = {
  config(programId: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('rmconfig')], programId);
    return { bump, pda };
  },

  rateLimitAccount(programId: PublicKey, token: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('limit'), token.toBuffer()], programId);
    return { bump, pda };
  },
};

export const ConnectionConfigPDA = {
  config(programId: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('config')], programId);

    return { bump, pda };
  },

  receipt(programId: PublicKey, srcChainId: BN, connectionSn: BN) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('receipt'), srcChainId.toBuffer(), connectionSn.toBuffer()],
      programId,
    );

    return { bump, pda };
  },
};

export const AssetManagerPDA = {
  config(programId: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('config-seed')], programId);

    return { bump, pda };
  },

  vault_token(programId: PublicKey, mint: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('vault_seed'), mint.toBuffer()], programId);

    return { bump, pda };
  },

  vault_native(programId: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('vault_native')], programId);

    return { bump, pda };
  },

  authority(programId: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from('dapp_authority')], programId);

    return { bump, pda };
  },

  ta_creation_fee_account_pda(programId: PublicKey, mint: PublicKey) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('ta_creation_account_seed'), mint.toBuffer()],
      programId,
    );

    return { bump, pda };
  },
};
