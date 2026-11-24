import { getCurrentInstance, inject } from 'vue';
import type { Store } from 'vuex';

/**
 * Access the dashboard's Vuex store without bundling a second copy of vuex
 * into the extension (vuex is not externalised by the shell build).
 * Vuex provides itself under the 'store' key; `$store` is the fallback.
 */
export function useShellStore(): Store<unknown> {
  const store = inject<Store<unknown> | null>('store', null) ||
    (getCurrentInstance()?.proxy?.$store as Store<unknown> | undefined);

  if (!store) {
    throw new Error('useShellStore() must be called from a component setup() inside the Rancher dashboard');
  }

  return store;
}
