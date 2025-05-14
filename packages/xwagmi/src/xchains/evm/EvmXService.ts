import { XService } from '@/core/XService';

export class EvmXService extends XService {
  private static instance: EvmXService;

  private constructor() {
    super('EVM');
  }

  getXConnectors() {
    return [];
  }

  public static getInstance(): EvmXService {
    if (!EvmXService.instance) {
      EvmXService.instance = new EvmXService();
    }
    return EvmXService.instance;
  }
}
