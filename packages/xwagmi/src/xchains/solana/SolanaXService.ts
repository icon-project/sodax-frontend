import { XService } from '@/core/XService';

export class SolanaXService extends XService {
  private static instance: SolanaXService;

  public connection: any;
  public wallet: any;
  public provider: any;

  private constructor() {
    super('SOLANA');
  }

  public static getInstance(): SolanaXService {
    if (!SolanaXService.instance) {
      SolanaXService.instance = new SolanaXService();
    }
    return SolanaXService.instance;
  }
}
