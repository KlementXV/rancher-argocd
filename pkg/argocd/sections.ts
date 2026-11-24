/**
 * Argo CD UI sections mirrored in the Rancher side nav (embed mode) and as
 * shortcuts on the landing page (link mode). Paths are Argo CD UI routes
 * (ui/src/app/app.tsx and settings-overview.tsx in argoproj/argo-cd).
 */
export interface ArgoSection {
  id: string;
  /** Path in the Argo CD UI, appended to the configured base URL. */
  path: string;
  icon: string;
  /** Side nav group (undefined = top level). */
  group?: 'settings';
  /** Higher = higher in the side nav. */
  weight: number;
  /** Also shown as a shortcut card on the landing page. */
  shortcut: boolean;
}

export const SETTINGS_GROUP = 'argocd-settings';

export const ARGO_SECTIONS: ArgoSection[] = [
  {
    id: 'applications', path: '/applications', icon: 'icon-apps', weight: 100, shortcut: true
  },
  {
    id: 'applicationsets', path: '/applicationsets', icon: 'icon-application', weight: 90, shortcut: true
  },
  {
    id: 'repos', path: '/settings/repos', icon: 'icon-git', group: 'settings', weight: 80, shortcut: true
  },
  {
    id: 'clusters', path: '/settings/clusters', icon: 'icon-cluster', group: 'settings', weight: 79, shortcut: true
  },
  {
    id: 'projects', path: '/settings/projects', icon: 'icon-folder', group: 'settings', weight: 78, shortcut: true
  },
  {
    id: 'accounts', path: '/settings/accounts', icon: 'icon-user', group: 'settings', weight: 77, shortcut: false
  },
  {
    id: 'certs', path: '/settings/certs', icon: 'icon-lock', group: 'settings', weight: 76, shortcut: false
  },
  {
    id: 'gpgkeys', path: '/settings/gpgkeys', icon: 'icon-document', group: 'settings', weight: 75, shortcut: false
  },
  {
    id: 'settings', path: '/settings', icon: 'icon-gear', group: 'settings', weight: 70, shortcut: true
  },
  {
    id: 'user-info', path: '/user-info', icon: 'icon-user', weight: 20, shortcut: true
  },
  {
    id: 'help', path: '/help', icon: 'icon-info', weight: 10, shortcut: true
  },
];

export const DEFAULT_SECTION = ARGO_SECTIONS[0];

export function sectionById(id?: unknown): ArgoSection {
  return ARGO_SECTIONS.find((s) => s.id === id) || DEFAULT_SECTION;
}

/** Absolute URL of a section, `base` being the validated Argo CD base URL. */
export function sectionUrl(base: string, section: ArgoSection): string {
  return `${ base.replace(/\/+$/, '') }${ section.path }`;
}

/** Side nav type name of a section (must be unique across all products). */
export function navTypeName(section: ArgoSection): string {
  return `argocd-nav-${ section.id }`;
}
