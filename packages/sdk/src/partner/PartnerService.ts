import type { ConfigService, HubProvider, SpokeService } from '../shared/index.js';
import { PartnerFeeClaimService, type PartnerFeeClaimServiceConstructorParams } from './PartnerFeeClaimService.js';

export type PartnerServiceConfig = {
  feeClaim?: PartnerFeeClaimServiceConstructorParams;
};

export type PartnerServiceConstructorParams = {
  config: ConfigService;
  hubProvider: HubProvider;
  spoke: SpokeService;
};

/**
 * PartnerService is a service that allows you to interact with the partner fee claim and other partner operations
 * @param {PartnerServiceConstructorParams} params - The constructor parameters
 * @namespace SodaxFeatures
 */
export class PartnerService {
  public readonly feeClaim: PartnerFeeClaimService; // Partner Fee Claim service for partner fee operations
  public readonly config: ConfigService;

  constructor({ config, hubProvider, spoke }: PartnerServiceConstructorParams) {
    this.config = config;
    this.feeClaim = new PartnerFeeClaimService({
      config: config,
      hubProvider: hubProvider,
      spoke: spoke,
    });
  }
}
