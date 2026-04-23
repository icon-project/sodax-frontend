import type { XAccount } from '@/types/index.js';

import { XConnector } from '@/core/index.js';
import { SuiXService } from './SuiXService.js';
import { assert, hasOptionalStringProperty, hasStringProperty, isRecord } from '@/shared/guards.js';

// Structural interface for what we actually use from a Sui wallet.
// We don't import the nominal type from @mysten/wallet-standard because
// @mysten/dapp-kit may resolve a different version, causing nominal mismatch.
// Structural typing avoids this: as long as the object has these fields, it works.
interface SuiWalletInfo {
  id?: string;
  name: string;
  icon?: string;
}

const isSuiWalletInfo = (value: unknown): value is SuiWalletInfo => {
  return (
    isRecord(value) &&
    hasStringProperty(value, 'name') &&
    // Some wallets may not expose `id` — in that case we fall back to `name` for stability.
    // We still validate if it exists.
    hasOptionalStringProperty(value, 'id') &&
    hasOptionalStringProperty(value, 'icon')
  );
};

export class SuiXConnector extends XConnector {
  public readonly wallet: SuiWalletInfo;

  constructor(wallet: unknown) {
    assert(isSuiWalletInfo(wallet), '[SuiXConnector] invalid wallet object');

    const id = wallet.id ?? wallet.name;
    // After the fallback, `id` is always defined.
    assert(typeof id === 'string' && id.length > 0, '[SuiXConnector] invalid wallet id');

    super('SUI', wallet.name, id);
    this.wallet = { id, name: wallet.name, icon: wallet.icon };
  }

  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}

  public override get icon(): string | undefined {
    return this.wallet.icon;
  }
}
