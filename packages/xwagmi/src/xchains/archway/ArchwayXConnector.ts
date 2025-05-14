import { XConnector } from '@/core/XConnector';
import type { XAccount } from '@/types';
import type { AccountData } from '@keplr-wallet/types';
import { ArchwayXService } from './ArchwayXService';
import { XSigningArchwayClient } from './XSigningArchwayClient';

export class ArchwayXConnector extends XConnector {
  constructor() {
    super('ARCHWAY', 'Keplr', 'keplr');
  }

  getXService(): ArchwayXService {
    return ArchwayXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const { keplr } = window as any;
    const { leap } = window as any;
    if (!keplr && !leap) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    keplr.defaultOptions = {
      sign: {
        preferNoSetFee: true,
      },
    };

    const chainId = this.getXService().chainId;
    if (leap) {
      await leap.enable(chainId);
    } else {
      await keplr.enable(chainId);
    }

    // @ts-ignore
    const offlineSigner = leap ? leap.getOfflineSignerOnlyAmino(chainId) : keplr.getOfflineSignerOnlyAmino(chainId);
    const signingClientObj = await XSigningArchwayClient.connectWithSigner(this.getXService().rpcURL, offlineSigner);

    this.getXService().setWalletClient(signingClientObj);

    const account: AccountData = (await offlineSigner.getAccounts())[0];
    return {
      address: account?.address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    this.getXService().walletClient?.disconnect();
    this.getXService().setWalletClient(null);

    // TODO: need to disconnect public client?
    // this.getXService().publicClient?.disconnect();
  }

  public get icon() {
    return 'https://raw.githubusercontent.com/balancednetwork/icons/master/wallets/keplr.svg';
  }
}
