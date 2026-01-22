import type { ConfigService, EvmHubProvider } from '../shared/index.js';
import { PartnerFeeClaimService, type PartnerFeeClaimServiceConfig } from './PartnerFeeClaimService.js';

export type PartnerServiceConfig = {
  feeClaim?: PartnerFeeClaimServiceConfig;
};

export type PartnerServiceConstructorParams = {
  feeClaim?: PartnerFeeClaimServiceConfig;
  configService: ConfigService;
  hubProvider: EvmHubProvider;
};

/**
 * PartnerService is a service that allows you to interact with the partner fee claim and other partner operations
 * @param {PartnerServiceConstructorParams} params - The constructor parameters
 */
export class PartnerService {
  public readonly feeClaim: PartnerFeeClaimService; // Partner Fee Claim service for partner fee operations

  constructor(config: PartnerServiceConstructorParams) {
    this.feeClaim = new PartnerFeeClaimService({
      config: config?.feeClaim,
      configService: config.configService,
      hubProvider: config.hubProvider,
    });
  }
}
