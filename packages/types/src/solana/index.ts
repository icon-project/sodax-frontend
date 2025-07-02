import type { WalletAddressProvider } from '../common/index.js';
import type {
    Connection,
    Keypair,
    PublicKey,
    TransactionInstruction,
    VersionedTransaction
} from '@solana/web3.js';

export type SolanaWalletConfig = {
    privateKey: Uint8Array;
};
export type SolanaEoaAddress = string;

type Hash = `0x${string}`

export interface ISolanaWalletProvider extends WalletAddressProvider {
    readonly connection: Connection;
    getWalletAddress: () => Promise<string>;
    getWalletAddressBytes: () => Promise<`0x${string}`>;
    sendTransaction: (transaction: VersionedTransaction) => Promise<Hash>;
    buildV0Txn: (instructions: TransactionInstruction[], signers: Keypair[]) => Promise<VersionedTransaction>;
    getAddress: () => PublicKey;
    getWallet: () => Keypair;
    getAssociatedTokenAddress: (mint: PublicKey) => Promise<PublicKey>;
}