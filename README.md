# rancher-argocd

Extension Rancher UI qui ajoute une entrée **Argo CD** dans le menu principal de Rancher, dans la section *Global Apps*, au même niveau que *Continuous Delivery* (Fleet).

- **v1 : lien.** Une page qui ouvre Argo CD dans un nouvel onglet. Le SSO OIDC se fait côté Argo CD.
- **Mode embarqué (optionnel) :** l'UI Argo CD s'affiche dans une iframe directement dans Rancher.
- **Prête pour l'air-gap :**
  - aucune ressource externe chargée (icône et traductions sont embarquées) ;
  - distribuée sous forme d'**image catalogue** OCI ;
  - URL configurable **à l'installation**, sans rebuild.

Compatibilité : Rancher **>= 2.10** (`@rancher/shell` 3.x).

## Configuration

L'extension lit sa configuration dans `spec.plugin.metadata` de sa ressource `UIPlugin`. Rancher l'expose au navigateur via `/v1/uiplugins`, il n'y a donc ni ConfigMap à rendre lisible ni droit RBAC à ajouter.

| Valeur Helm du chart                | Défaut | Rôle                                                     |
|-------------------------------------|--------|----------------------------------------------------------|
| `plugin.metadata.argocd-url`        | -      | URL d'Argo CD (`https://...`, obligatoire)                |
| `plugin.metadata.argocd-embed`      | `false`| `"true"` : affiche Argo CD dans une iframe                |

L'URL est validée : seules les URL `http(s)` absolues sont acceptées.

Pour modifier ces valeurs après l'installation : *Apps > Installed Apps > argocd > Edit/Upgrade*, onglet YAML, puis :

```yaml
plugin:
  metadata:
    argocd-url: https://argocd.example.com
    argocd-embed: "false"
```

Sans URL configurée, la page affiche un avertissement. Les administrateurs voient en plus la commande Helm à lancer.

### Mode embarqué (iframe)

Par défaut, Argo CD refuse d'être affiché dans une iframe. Pour l'autoriser, ajoute dans `argocd-cmd-params-cm` :

```yaml
data:
  server.x.frame.options: ""
  server.content.security.policy: "frame-ancestors 'self' https://rancher.example.com;"
```

Puis redémarre `argocd-server`. Rancher et Argo CD doivent être sur **le même domaine parent** (par exemple `rancher.example.com` et `argocd.example.com`). Sinon le cookie de session d'Argo CD (SameSite) est bloqué dans l'iframe, et la connexion SSO tourne en boucle.

## Développement

Prérequis : Node >= 24 et Yarn 1.

```bash
yarn install            # avec Node 26 : yarn install --ignore-engines
yarn test               # tests unitaires (config, enregistrement du produit)
yarn lint
yarn build-pkg argocd   # => dist-pkg/argocd-<version>/
```

Pour tester sur un vrai Rancher sans rien publier :

```bash
yarn build-pkg argocd && yarn serve-pkgs
```

Ensuite, dans Rancher :
1. *Preferences* : active *Enable Extension developer features*.
2. *Extensions > ⋮ > Developer Load*, avec l'URL affichée par `serve-pkgs`.

Pour passer les métadonnées en dev, coche *Persist extension by creating custom resource*, puis édite le `UIPlugin` créé :

```bash
kubectl -n cattle-ui-plugin-system edit uiplugin argocd
# spec.plugin.metadata.argocd-url: https://...
```

## Air-gap

### 1. Sur une machine connectée

Prérequis : `node`, `yarn`, `jq`, `yq`, `helm`, `git`, `docker` (ou `podman` avec `RUNTIME=podman`).

```bash
scripts/airgap-bundle.sh harbor.corp.local platform
```

Le script :
1. lance les tests ;
2. construit l'**image catalogue** `harbor.corp.local/platform/ui-extension-rancher-argocd:<version>`, avec le script officiel `publish-pkgs -c` de Rancher (nginx + dépôt Helm + bundle JS) ;
3. l'exporte dans `airgap/` avec le chart et un fichier `SHA256SUMS`.

L'image de base `registry.suse.com/bci/bci-base` doit être accessible au moment du build.

### 2. Dans le réseau isolé

Transfère le dossier `airgap/`, puis :

```bash
sha256sum -c SHA256SUMS
docker load -i ui-extension-rancher-argocd-<version>.tar
docker push harbor.corp.local/platform/ui-extension-rancher-argocd:<version>
```

### 3. Dans Rancher (en admin)

1. *Extensions* > ⋮ > **Manage Extension Catalogs** > **Import Extension Catalog**.
   - *Catalog Image Reference* : `harbor.corp.local/platform/ui-extension-rancher-argocd:<version>`.
   - *Image Pull Secret* : seulement si ton registre est authentifié.

   Rancher déploie alors l'image dans `cattle-ui-plugin-system` et crée le dépôt Helm correspondant.
2. Onglet *Available* : installe **Argo CD**.
3. Renseigne `plugin.metadata.argocd-url` (voir [Configuration](#configuration)).
4. Recharge le navigateur : **Argo CD** apparaît dans le menu ☰.

### Mise à jour

1. Incrémente `version` **dans les deux** `package.json` (racine et `pkg/argocd/`). Le script vérifie qu'ils sont identiques.
2. Relance le bundle et pousse la nouvelle image.
3. Dans *Manage Extension Catalogs*, mets à jour la référence de l'image.
4. Fais l'upgrade de l'extension en gardant tes valeurs.

## Structure

```
pkg/argocd/
  index.ts             enregistrement (produit + route)
  product.ts           entrée du menu global (inStore: management, comme Fleet)
  routing.ts           route /argocd/c/_
  config.ts            lecture/validation de la config depuis /v1/uiplugins
  pages/ArgoCDPage.vue page (lien ou iframe, états "non configuré"/erreur)
  assets/argocd.svg    icône embarquée
  l10n/en-us.yaml      traductions
scripts/airgap-bundle.sh
```

## Évolutions possibles

Une vraie page native (liste des Applications, statut de sync et de santé) qui appelle l'API d'Argo CD. Côté authentification, deux options :
- un flux OIDC PKCE avec le `cliClientID` d'Argo CD (même IdP que Rancher), puis des appels `Authorization: Bearer <id_token>` ;
- un proxy côté serveur.

Dans les deux cas, il faudra gérer le CORS ou exposer l'API sous le même domaine que Rancher.
