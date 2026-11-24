import { IPlugin } from '@shell/core/types';
import type { Store } from 'vuex';
import { PRODUCT_NAME } from './config';
import { ARGO_SECTIONS, navTypeName, SETTINGS_GROUP } from './sections';

export const BLANK_CLUSTER = '_';
/** Landing page (plain layout, no side nav). */
export const HOME_ROUTE = `${ PRODUCT_NAME }-c-cluster`;
/** Embedded Argo CD section (default layout, side nav = Argo CD navigation). */
export const SECTION_ROUTE = `${ PRODUCT_NAME }-c-cluster-section`;

/**
 * Top-level product in the global menu (same section as Fleet / Continuous Delivery).
 * Uses the legacy DSL on purpose so the extension runs on Rancher >= 2.10
 * (the Product Registration API needs >= 2.15).
 */
export function init($plugin: IPlugin, store: Store<unknown>): void {
  const {
    product, virtualType, basicType, weightType, weightGroup
  } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    inStore:             'management',
    // Bundled with the extension: no external request, air-gap safe.
    svg:                 require('./assets/argocd.svg'),
    weight:              90,
    removable:           false,
    showClusterSwitcher: false,
    showNamespaceFilter: false,
    to:                  {
      name:   HOME_ROUTE,
      params: {
        product: PRODUCT_NAME, cluster: BLANK_CLUSTER, pkg: PRODUCT_NAME
      },
    },
  });

  // Side nav (only rendered on SECTION_ROUTE, which uses the default layout):
  // the Argo CD navigation, so Argo CD's own sidebar can be collapsed in the iframe.
  for (const section of ARGO_SECTIONS) {
    virtualType({
      name:     navTypeName(section),
      labelKey: `argocd.section.${ section.id }.label`,
      weight:   section.weight,
      route:    {
        name:   SECTION_ROUTE,
        params: {
          product: PRODUCT_NAME, cluster: BLANK_CLUSTER, pkg: PRODUCT_NAME, section: section.id
        },
      },
    });
  }

  const top = ARGO_SECTIONS.filter((s) => !s.group);
  const settings = ARGO_SECTIONS.filter((s) => s.group === 'settings');

  basicType(top.map(navTypeName));
  basicType(settings.map(navTypeName), SETTINGS_GROUP);
  weightGroup(SETTINGS_GROUP, 50, true);

  for (const section of ARGO_SECTIONS) {
    weightType(navTypeName(section), section.weight, true);
  }
}
