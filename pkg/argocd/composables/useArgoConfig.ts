import { onMounted, ref, Ref } from 'vue';
import { ArgoConfig, fetchArgoConfig } from '../config';

let cached: Promise<ArgoConfig> | undefined;

/**
 * Configuration is read once per page load (shared by the landing page and
 * every embedded section), so switching sections in the side nav is instant.
 * A failed read is not cached.
 */
export function loadArgoConfig(fetchFn?: typeof fetch): Promise<ArgoConfig> {
  if (!cached) {
    cached = fetchArgoConfig(fetchFn).catch((e) => {
      cached = undefined;
      throw e;
    });
  }

  return cached;
}

/** Test helper. */
export function resetArgoConfigCache(): void {
  cached = undefined;
}

export function useArgoConfig(): { loading: Ref<boolean>; error: Ref<string | undefined>; config: Ref<ArgoConfig> } {
  const loading = ref(true);
  const error = ref<string>();
  const config = ref<ArgoConfig>({ embed: false });

  onMounted(async() => {
    try {
      config.value = await loadArgoConfig();
    } catch (e) {
      error.value = (e as Error)?.message || String(e);
    } finally {
      loading.value = false;
    }
  });

  return {
    loading, error, config
  };
}
