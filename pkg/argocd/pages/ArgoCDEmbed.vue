<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Loading from '@shell/components/Loading.vue';
import ConfigStatus from '../components/ConfigStatus.vue';
import { useArgoConfig } from '../composables/useArgoConfig';
import { PRODUCT_NAME } from '../config';
import { BLANK_CLUSTER, HOME_ROUTE } from '../product';
import { sectionById, sectionUrl } from '../sections';
import { useTranslation } from '../utils/i18n';

/**
 * Embedded Argo CD section, rendered in the shell "default" layout: the
 * Rancher side nav carries the Argo CD navigation, so Argo CD's own sidebar
 * can stay collapsed inside the iframe.
 */
const t = useTranslation();
const route = useRoute();
const router = useRouter();
const { loading, error, config } = useArgoConfig();

const section = computed(() => sectionById(route.params.section));
const src = computed(() => (config.value.url ? sectionUrl(config.value.url, section.value) : undefined));
const reloadKey = ref(0);

// Link mode has no embedded pages: go back to the landing page.
const linkMode = computed(() => !loading.value && !error.value && !!config.value.url && !config.value.embed);

watch(linkMode, (go) => {
  if (go) {
    router.replace({
      name:   HOME_ROUTE,
      params: {
        product: PRODUCT_NAME, cluster: route.params.cluster || BLANK_CLUSTER, pkg: PRODUCT_NAME
      },
    });
  }
}, { immediate: true });
</script>

<template>
  <Loading
    v-if="loading || linkMode"
    mode="relative"
  />
  <ConfigStatus
    v-else-if="error || !src"
    :config="config"
    :error="error"
  />
  <div
    v-else
    class="argocd-embed"
  >
    <header class="argocd-embed__bar">
      <h1>
        <i
          :class="['icon', section.icon, 'mr-10']"
          aria-hidden="true"
        />{{ t(`argocd.section.${ section.id }.label`) }}
      </h1>
      <div class="argocd-embed__actions">
        <button
          type="button"
          class="btn role-tertiary"
          :aria-label="t('argocd.page.reload')"
          data-testid="argocd-reload"
          @click="reloadKey++"
        >
          <i
            class="icon icon-refresh"
            aria-hidden="true"
          />
        </button>
        <a
          :href="src"
          target="_blank"
          rel="noopener noreferrer"
          class="btn role-secondary"
          data-testid="argocd-open-tab"
        >
          <i
            class="icon icon-external-link mr-5"
            aria-hidden="true"
          />{{ t('argocd.page.openNewTab') }}
        </a>
      </div>
    </header>

    <iframe
      :key="`${ section.id }-${ reloadKey }`"
      class="argocd-embed__frame"
      :src="src"
      :title="t(`argocd.section.${ section.id }.label`)"
      referrerpolicy="strict-origin-when-cross-origin"
    />
  </div>
</template>

<style lang="scss" scoped>
.argocd-embed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: calc(100vh - var(--header-height) - 48px);

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    h1 {
      margin: 0;
      display: flex;
      align-items: center;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__frame {
    flex: 1;
    width: 100%;
    min-height: 500px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--body-bg);
  }
}
</style>
