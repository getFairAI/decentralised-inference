import { EIP1193Events, EIP1193Provider, EIP1193RequestFn, EIP1474Methods } from 'viem';
import { Prettify } from 'viem/chains';

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: ExtendedEIP1193Provider;
}

export interface EIP6963ProviderInfo {
  walletId: string;
  uuid: string;
  name: string;
  icon: string;
}

export type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider;
  };
};

export type ExtendedEIPMethods = [
  ...EIP1474Methods,
  {
    Method: 'eth_getEncryptionPublicKey';
    Parameters: string[];
    ReturnType: string;
  },
  {
    Method: 'eth_decrypt';
    Parameters: [string, string];
    ReturnType: string;
  },
];

export type ExtendedEIP1193Provider = Prettify<
  EIP1193Events & {
    request: EIP1193RequestFn<ExtendedEIPMethods>;
  }
>;
