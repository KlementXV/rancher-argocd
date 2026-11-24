import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import routes from './routing';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import l10n (and any future model/detail/edit folders)
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Top-level "Argo CD" entry in the global menu, next to Continuous Delivery
  plugin.addProduct(require('./product'));

  for (const { parent, route } of routes) {
    plugin.addRoute(parent, route);
  }
}
