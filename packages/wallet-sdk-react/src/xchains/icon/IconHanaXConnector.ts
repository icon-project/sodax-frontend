import type { XAccount } from '@/types/index.js';
import { ICONexRequestEventType, ICONexResponseEventType, request } from './iconex/index.js';

import { XConnector } from '@/core/XConnector.js';
import { assert, hasBooleanProperty, isRecord } from '@/shared/guards.js';
import { WALLET_METADATA } from '@/constants.js';

const isHanaWallet = (value: unknown): value is { available?: boolean } => {
  return isRecord(value) && (value.available === undefined || hasBooleanProperty(value, 'available'));
};

export class IconHanaXConnector extends XConnector {
  constructor() {
    super('ICON', 'Hana Wallet', 'hana');
  }

  public override get isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    const hanaWallet = (window as unknown as Record<string, unknown>).hanaWallet;
    return isHanaWallet(hanaWallet) && hanaWallet.available === true;
  }

  public override get installUrl(): string {
    return WALLET_METADATA.hana.installUrl;
  }

  async connect(): Promise<XAccount | undefined> {
    const hanaWallet = (window as unknown as Record<string, unknown>).hanaWallet;
    assert(isHanaWallet(hanaWallet) || hanaWallet === undefined, '[IconHanaXConnector] invalid window.hanaWallet type');

    if (!hanaWallet || !hanaWallet.available) {
      window.open(WALLET_METADATA.hana.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const detail = await request({
      type: ICONexRequestEventType.REQUEST_ADDRESS,
    });

    if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
      return {
        address: detail?.payload,
        xChainType: this.xChainType,
      };
    }

    console.warn('[IconHanaXConnector] connect: unexpected response from Hana wallet', detail);
    return undefined;
  }

  async disconnect(): Promise<void> {
    console.log('HanaIconXConnector disconnected');
  }

  public override get icon(): string {
    return WALLET_METADATA.hana.icon;
  }
}
