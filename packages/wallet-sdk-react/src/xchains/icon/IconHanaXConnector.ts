import type { XAccount } from '@/types/index.js';
import { ICONexRequestEventType, ICONexResponseEventType, request } from './iconex/index.js';

import { XConnector } from '@/core/XConnector.js';
import { assert, hasBooleanProperty, isRecord } from '@/shared/guards.js';

const isHanaWallet = (value: unknown): value is { isAvailable?: boolean } => {
  return isRecord(value) && (value.isAvailable === undefined || hasBooleanProperty(value, 'isAvailable'));
};

export class IconHanaXConnector extends XConnector {
  constructor() {
    super('ICON', 'Hana Wallet', 'hana');
  }

  async connect(): Promise<XAccount | undefined> {
    const hanaWallet = (window as unknown as Record<string, unknown>).hanaWallet;
    assert(isHanaWallet(hanaWallet) || hanaWallet === undefined, '[IconHanaXConnector] invalid window.hanaWallet type');

    if (!hanaWallet || !hanaWallet.isAvailable) {
      window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl', '_blank');
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
    return 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/hana.svg';
  }
}
