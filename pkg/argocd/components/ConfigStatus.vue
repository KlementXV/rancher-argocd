<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@components/Banner';
import { ArgoConfig, META_EMBED, META_URL } from '../config';
import { useShellStore } from '../utils/store';
import { useTranslation } from '../utils/i18n';

/** Error / "not configured" states shared by both pages. */
const props = defineProps<{ config: ArgoConfig; error?: string }>();

const t = useTranslation();
const store = useShellStore();

const isAdmin = computed<boolean>(() => !!store.getters['auth/isAdmin']);
const invalidUrl = computed(() => props.config.invalidUrl);
const helmExample = `plugin:
  metadata:
    ${ META_URL }: https://argocd.example.com
    ${ META_EMBED }: "false"   # "true" = Argo CD inside Rancher`;
</script>

<template>
  <div class="argocd-status">
    <Banner
      v-if="error"
      color="error"
      :label="t('argocd.page.loadError', { error })"
    />
    <template v-else>
      <Banner
        v-if="invalidUrl"
        color="error"
        :label="t('argocd.page.invalidUrl', { url: invalidUrl })"
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
  </div>
</template>

<style lang="scss" scoped>
.argocd-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
}

.argocd-howto {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  p, pre {
    margin: 0;
  }
}
</style>
