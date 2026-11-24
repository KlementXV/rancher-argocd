<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useShellStore } from '../utils/store';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading.vue';
import { ArgoConfig, fetchArgoConfig, META_EMBED, META_URL } from '../config';
import { useTranslation } from '../utils/i18n';

const t = useTranslation();
const store = useShellStore();

const loading = ref(true);
const error = ref<string>();
const config = ref<ArgoConfig>({ embed: false });

const isAdmin = computed<boolean>(() => !!store.getters['auth/isAdmin']);
const helmExample = computed(() => `helm upgrade argocd <repo>/argocd -n cattle-ui-plugin-system --reuse-values \\\n  --set plugin.metadata.${ META_URL }=https://argocd.example.com \\\n  --set-string plugin.metadata.${ META_EMBED }=false`);

onMounted(async() => {
  try {
    config.value = await fetchArgoConfig();
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Loading
    v-if="loading"
    mode="main"
  />
  <div
    v-else
    class="argocd-page"
  >
    <header class="argocd-header">
      <h1>{{ t('argocd.page.title') }}</h1>
      <a
        v-if="config.url && config.embed"
        :href="config.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn role-secondary"
      >
        <i
          class="icon icon-external-link mr-5"
          aria-hidden="true"
        />{{ t('argocd.page.openNewTab') }}
      </a>
    </header>

    <Banner
      v-if="error"
      color="error"
      :label="t('argocd.page.loadError', { error })"
    />

    <template v-else-if="!config.url">
      <Banner
        v-if="config.invalidUrl"
        color="error"
        :label="t('argocd.page.invalidUrl', { url: config.invalidUrl })"
      />
      <Banner
        v-else
        color="warning"
        :label="t('argocd.page.notConfigured')"
      />
      <div
        v-if="isAdmin"
        class="argocd-howto"
      >
        <p>{{ t('argocd.page.howto') }}</p>
        <pre><code>{{ helmExample }}</code></pre>
      </div>
    </template>

    <iframe
      v-else-if="config.embed"
      class="argocd-frame"
      :src="config.url"
      :title="t('argocd.page.title')"
      referrerpolicy="strict-origin-when-cross-origin"
    />

    <div
      v-else
      class="argocd-card"
    >
      <p>{{ t('argocd.page.description') }}</p>
      <p class="text-muted">
        {{ t('argocd.page.sso') }}
      </p>
      <a
        :href="config.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn role-primary"
      >
        <i
          class="icon icon-external-link mr-5"
          aria-hidden="true"
        />{{ t('argocd.page.open') }}
      </a>
      <p class="argocd-url text-muted">
        {{ config.url }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.argocd-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.argocd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    margin: 0;
  }
}

.argocd-card,
.argocd-howto {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 24px;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  p {
    margin: 0;
  }
}

.argocd-howto pre {
  width: 100%;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.argocd-url {
  font-family: monospace;
  word-break: break-all;
}

.argocd-frame {
  flex: 1;
  min-height: 600px;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background: var(--body-bg);
}
</style>
