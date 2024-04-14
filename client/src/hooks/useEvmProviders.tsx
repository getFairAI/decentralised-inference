import { EIP6963AnnounceProviderEvent, EIP6963ProviderDetail } from '@/interfaces/evm';
import { useSyncExternalStore } from 'react';

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent
  }
}

let providers: EIP6963ProviderDetail[] = [];

const store = {
  value: () => providers,
  subscribe: (callback: ()=> void ) => {
    const onAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
      if (providers.map(p => p.info.uuid).includes(event.detail.info.uuid)) {
        return;
      } else {
        providers = [...providers, event.detail];
        callback();
      }
    };
    window.addEventListener('eip6963:announceProvider', onAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    
    // unsubscribe onDestroy
    return () => window.removeEventListener('eip6963:announceProvider', onAnnouncement);
  }
};

export const useEvmProviders = () => useSyncExternalStore(store.subscribe, store.value, store.value);