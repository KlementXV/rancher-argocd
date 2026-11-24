/**
 * Runtime configuration for the Argo CD extension.
 *
 * Nothing is hard-coded at build time: the Argo CD URL is read from the
 * `spec.plugin.metadata` of the UIPlugin resource, which Rancher exposes to
 * the browser through `/v1/uiplugins`. Set it with the Helm value
 * `plugin.metadata.argocd-url` when installing/upgrading the extension chart.
 * The same image/chart can therefore be promoted across air-gapped
 * environments without a rebuild.
 */
export const PRODUCT_NAME = 'argocd';

export const UI_PLUGINS_URL = '/v1/uiplugins';

export const META_URL = 'argocd-url';
export const META_EMBED = 'argocd-embed';

export interface ArgoConfig {
  /** Validated, normalised Argo CD base URL, or undefined when not configured / invalid. */
  url?: string;
  /** Raw value that was found but rejected (used to show a helpful error). */
  invalidUrl?: string;
  /** Show Argo CD inside an iframe instead of a link card. */
  embed: boolean;
}

interface UIPluginEntry {
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Only absolute http(s) URLs are accepted: this blocks `javascript:` and
 * other schemes from ever reaching an href or iframe src.
 */
export function parseArgoUrl(raw?: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(raw.trim());
  } catch {
    return undefined;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return undefined;
  }

  return parsed.toString().replace(/\/+$/, '');
}

function isTrue(raw?: unknown): boolean {
  return typeof raw === 'string' && ['true', '1', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

/**
 * Pick our entry out of the `/v1/uiplugins` payload. The UIPlugin name is the
 * Helm release fullname, so prefer an exact name match, then any entry that
 * carries our metadata key (release installed under another name).
 */
export function configFromUIPlugins(payload: unknown): ArgoConfig {
  const raw = (payload as { entries?: unknown; Entries?: unknown }) || {};
  const entries = Object.values((raw.entries || raw.Entries || {}) as Record<string, UIPluginEntry>);

  const entry = entries.find((e) => e?.name === PRODUCT_NAME && e.metadata?.[META_URL]) ||
    entries.find((e) => !!e?.metadata?.[META_URL]);

  const rawUrl = entry?.metadata?.[META_URL];
  const url = parseArgoUrl(rawUrl);

  return {
    url,
    invalidUrl: !url && rawUrl ? rawUrl : undefined,
    embed:      isTrue(entry?.metadata?.[META_EMBED]),
  };
}

export async function fetchArgoConfig(fetchFn: typeof fetch = fetch): Promise<ArgoConfig> {
  const res = await fetchFn(UI_PLUGINS_URL, {
    credentials: 'same-origin',
    headers:     { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`${ UI_PLUGINS_URL } returned HTTP ${ res.status }`);
  }

  return configFromUIPlugins(await res.json());
}
