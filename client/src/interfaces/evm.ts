import { EIP1193Provider } from 'viem';

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963ProviderInfo {
  walletId: string;
  uuid: string;
  name: string;
  icon: string;
}

export type EIP6963AnnounceProviderEvent = {
  detail:{
    info: EIP6963ProviderInfo,
    provider: EIP1193Provider
  }
}
