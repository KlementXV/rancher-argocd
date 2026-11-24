import { IPlugin } from '@shell/core/types';
import type { Store } from 'vuex';
import { PRODUCT_NAME } from './config';

export const BLANK_CLUSTER = '_';
export const ROUTE_NAME = `${ PRODUCT_NAME }-c-cluster`;

/**
 * Top-level product in the global menu (same section as Fleet / Continuous Delivery).
 * Uses the legacy DSL on purpose so the extension runs on Rancher >= 2.10
 * (the Product Registration API needs >= 2.15).
 */
export function init($plugin: IPlugin, store: Store<unknown>): void {
  const { product } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    inStore:             'management',
    // Bundled with the extension: no external request, air-gap safe.
    svg:                 require('./assets/argocd.svg'),
    weight:              90,
    removable:           false,
    showClusterSwitcher: false,
    showNamespaceFilter: false,
    to:                  {
      name:   ROUTE_NAME,
      params: {
        product: PRODUCT_NAME, cluster: BLANK_CLUSTER, pkg: PRODUCT_NAME
      },
    },
  });
}
