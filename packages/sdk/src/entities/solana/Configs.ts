import {
  Connection,
  type Keypair,
  PublicKey,
  TransactionInstruction,
  type AccountMeta
} from '@solana/web3.js';
import type BN from 'bn.js';

const TRANSFER_DISCRIMINATOR = Buffer.from([163, 52, 200, 231, 140, 3, 69, 186]);
const SEND_MESSAGE_DISCRIMINATOR = Buffer.from([57, 40, 34, 178, 189, 10, 65, 26]);

function serializeBytes(data: Buffer): Buffer {
  const lengthBuffer = Buffer.allocUnsafe(4);
  lengthBuffer.writeUInt32LE(data.length, 0);
  return Buffer.concat([lengthBuffer, data]);
}

function serializeU64(value: BN): Buffer {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigUInt64LE(BigInt(value.toString()), 0);
  return buffer;
}

function serializeU128(value: BN): Buffer {
  const buffer = Buffer.allocUnsafe(16);
  const bigIntValue = BigInt(value.toString());
  buffer.writeBigUInt64LE(bigIntValue & 0xFFFFFFFFFFFFFFFFn, 0);
  buffer.writeBigUInt64LE(bigIntValue >> 64n, 8);
  return buffer;
}

export interface SolanaProgram {
  programId: PublicKey;
  connection: Connection;
  methods: {
    transfer?: (amount: BN, to: Buffer, data: Buffer) => SolanaInstructionBuilder;
    sendMessage?: (dstChainId: BN, dstAddress: Buffer, payload: Buffer) => SolanaInstructionBuilder;
  };
}

export interface SolanaInstructionBuilder {
  accountsStrict?: (accounts: TransferAccounts) => SolanaInstructionBuilder;
  accounts?: (accounts: SendMessageAccounts) => SolanaInstructionBuilder;
  remainingAccounts?: (accounts: AccountMeta[]) => SolanaInstructionBuilder;
  instruction(): Promise<TransactionInstruction>;
}

export interface TransferAccounts {
  signer: PublicKey;
  systemProgram: PublicKey;
  config: PublicKey;
  nativeVaultAccount: PublicKey | null;
  tokenVaultAccount: PublicKey | null;
  signerTokenAccount: PublicKey | null;
  authority: PublicKey;
  mint: PublicKey | null;
  connection: PublicKey;
  tokenProgram: PublicKey;
}

export interface SendMessageAccounts {
  signer: PublicKey;
  dapp: PublicKey | null;
  systemProgram: PublicKey;
  config: PublicKey;
}

class TransferInstructionBuilder implements SolanaInstructionBuilder {
  private programId: PublicKey;
  private amount: BN;
  private to: Buffer;
  private data: Buffer;
  private accountsData: TransferAccounts | null = null;
  private remaining: AccountMeta[] = [];

  constructor(programId: PublicKey, amount: BN, to: Buffer, data: Buffer) {
    this.programId = programId;
    this.amount = amount;
    this.to = to;
    this.data = data;
  }

  accountsStrict(accounts: TransferAccounts): SolanaInstructionBuilder {
    this.accountsData = accounts;
    return this;
  }

  remainingAccounts(accounts: AccountMeta[]): SolanaInstructionBuilder {
    this.remaining = accounts;
    return this;
  }

  async instruction(): Promise<TransactionInstruction> {
    if (!this.accountsData) {
      throw new Error('Accounts must be set before creating instruction');
    }

    const instructionData = Buffer.concat([
      TRANSFER_DISCRIMINATOR,
      serializeU64(this.amount),
      serializeBytes(this.to),
      serializeBytes(this.data)
    ]);

    const keys: AccountMeta[] = [
      { pubkey: this.accountsData.signer, isSigner: true, isWritable: true },
      { pubkey: this.accountsData.systemProgram, isSigner: false, isWritable: false },
      { pubkey: this.accountsData.config, isSigner: false, isWritable: true },
    ];

    if (this.accountsData.nativeVaultAccount) {
      keys.push({ pubkey: this.accountsData.nativeVaultAccount, isSigner: false, isWritable: true });
    }
    if (this.accountsData.tokenVaultAccount) {
      keys.push({ pubkey: this.accountsData.tokenVaultAccount, isSigner: false, isWritable: true });
    }
    if (this.accountsData.signerTokenAccount) {
      keys.push({ pubkey: this.accountsData.signerTokenAccount, isSigner: false, isWritable: true });
    }

    keys.push({ pubkey: this.accountsData.authority, isSigner: false, isWritable: false });

    if (this.accountsData.mint) {
      keys.push({ pubkey: this.accountsData.mint, isSigner: false, isWritable: false });
    }

    keys.push(
        { pubkey: this.accountsData.connection, isSigner: false, isWritable: false },
        { pubkey: this.accountsData.tokenProgram, isSigner: false, isWritable: false },
    );

    keys.push(...this.remaining);

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data: instructionData,
    });
  }
}

class SendMessageInstructionBuilder implements SolanaInstructionBuilder {
  private programId: PublicKey;
  private dstChainId: BN;
  private dstAddress: Buffer;
  private payload: Buffer;
  private accountsData: SendMessageAccounts | null = null;

  constructor(programId: PublicKey, dstChainId: BN, dstAddress: Buffer, payload: Buffer) {
    this.programId = programId;
    this.dstChainId = dstChainId;
    this.dstAddress = dstAddress;
    this.payload = payload;
  }

  accounts(accounts: SendMessageAccounts): SolanaInstructionBuilder {
    this.accountsData = accounts;
    return this;
  }

  async instruction(): Promise<TransactionInstruction> {
    if (!this.accountsData) {
      throw new Error('Accounts must be set before creating instruction');
    }

    const instructionData = Buffer.concat([
      SEND_MESSAGE_DISCRIMINATOR,
      serializeU128(this.dstChainId),
      serializeBytes(this.dstAddress),
      serializeBytes(this.payload)
    ]);

    const keys: AccountMeta[] = [
      { pubkey: this.accountsData.signer, isSigner: true, isWritable: true },
    ];

    if (this.accountsData.dapp) {
      keys.push({ pubkey: this.accountsData.dapp, isSigner: true, isWritable: false });
    }

    keys.push(
        { pubkey: this.accountsData.systemProgram, isSigner: false, isWritable: false },
        { pubkey: this.accountsData.config, isSigner: false, isWritable: true },
    );

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data: instructionData,
    });
  }
}

export async function getConnection(rpcUrl: string, wsUrl: string): Promise<Connection> {
  return new Connection(rpcUrl, {
    wsEndpoint: wsUrl,
    commitment: 'confirmed'
  });
}

export async function getAssetManagerProgram(
    keypair: Keypair,
    rpcUrl: string,
    wsUrl: string,
    assetManager: string,
): Promise<SolanaProgram> {
  const connection = await getConnection(rpcUrl, wsUrl);
  const programId = new PublicKey(assetManager);

  return {
    programId,
    connection,
    methods: {
      transfer: (amount: BN, to: Buffer, data: Buffer) => {
        return new TransferInstructionBuilder(programId, amount, to, data);
      }
    }
  };
}

export async function getConnectionProgram(
    keypair: Keypair,
    rpcUrl: string,
    wsUrl: string,
    connection: string,
): Promise<SolanaProgram> {
  const conn = await getConnection(rpcUrl, wsUrl);
  const programId = new PublicKey(connection);

  return {
    programId,
    connection: conn,
    methods: {
      sendMessage: (dstChainId: BN, dstAddress: Buffer, payload: Buffer) => {
        return new SendMessageInstructionBuilder(programId, dstChainId, dstAddress, payload);
      }
    }
  };
}