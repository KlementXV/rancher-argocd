import ArgoCDPage from './pages/ArgoCDPage.vue';
import { PRODUCT_NAME } from './config';
import { BLANK_CLUSTER, ROUTE_NAME } from './product';

export default [
  {
    name:      ROUTE_NAME,
    path:      `/${ PRODUCT_NAME }/c/:cluster`,
    component: ArgoCDPage,
    meta:      {
      product: PRODUCT_NAME, cluster: BLANK_CLUSTER, pkg: PRODUCT_NAME
    },
  },
];
