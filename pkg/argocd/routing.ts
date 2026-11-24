import ArgoCDHome from './pages/ArgoCDHome.vue';
import ArgoCDEmbed from './pages/ArgoCDEmbed.vue';
import { PRODUCT_NAME } from './config';
import { BLANK_CLUSTER, HOME_ROUTE, SECTION_ROUTE } from './product';

const meta = {
  product: PRODUCT_NAME, cluster: BLANK_CLUSTER, pkg: PRODUCT_NAME
};

/** Shell parent route names: 'plain' has no side nav, 'default' has one. */
export default [
  {
    parent: 'plain',
    route:  {
      name:      HOME_ROUTE,
      path:      `/${ PRODUCT_NAME }/c/:cluster`,
      component: ArgoCDHome,
      meta,
    },
  },
  {
    parent: 'default',
    route:  {
      name:      SECTION_ROUTE,
      path:      `/${ PRODUCT_NAME }/c/:cluster/:section`,
      component: ArgoCDEmbed,
      meta,
    },
  },
];
