<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Loading from '@shell/components/Loading.vue';
import IconOrSvg from '@shell/components/IconOrSvg.vue';
import logo from '../assets/argocd.svg';
import ConfigStatus from '../components/ConfigStatus.vue';
import { useArgoConfig } from '../composables/useArgoConfig';
import { PRODUCT_NAME } from '../config';
import { BLANK_CLUSTER, SECTION_ROUTE } from '../product';
import { ARGO_SECTIONS, DEFAULT_SECTION, sectionUrl } from '../sections';
import { useTranslation } from '../utils/i18n';

/**
 * Landing page, rendered in the shell "plain" layout (no side nav).
 * - link mode: Argo CD dashboard with shortcuts opening Argo CD in a new tab
 * - embed mode: redirects to the embedded Applications section (with side nav)
 */
const t = useTranslation();
const route = useRoute();
const router = useRouter();
const { loading, error, config } = useArgoConfig();

const redirecting = computed(() => !!config.value.url && config.value.embed);

watch(redirecting, (go) => {
  if (go) {
    router.replace({
      name:   SECTION_ROUTE,
      params: {
        product: PRODUCT_NAME, cluster: route.params.cluster || BLANK_CLUSTER, pkg: PRODUCT_NAME, section: DEFAULT_SECTION.id
      },
    });
  }
});

const shortcuts = computed(() => {
  const base = config.value.url;

  if (!base) {
    return [];
  }

  return ARGO_SECTIONS.filter((s) => s.shortcut).map((s) => ({ ...s, href: sectionUrl(base, s) }));
});
</script>

<template>
  <Loading
    v-if="loading || redirecting"
    mode="relative"
  />
  <div
    v-else
    class="argocd-home"
  >
    <header class="argocd-hero">
      <div class="argocd-hero__identity">
        <span
          class="argocd-hero__logo"
          aria-hidden="true"
        >
          <IconOrSvg
            :src="logo"
            color="primary"
          />
        </span>
        <div>
          <h1>{{ t('argocd.page.title') }}</h1>
          <p class="text-muted">
            {{ t('argocd.page.description') }}
          </p>
        </div>
      </div>
      <a
        v-if="config.url"
        :href="config.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn role-primary"
        data-testid="argocd-open"
      >
        <i
          class="icon icon-external-link mr-5"
          aria-hidden="true"
        />{{ t('argocd.page.open') }}
      </a>
    </header>

    <ConfigStatus
      v-if="error || !config.url"
      :config="config"
      :error="error"
    />

    <template v-else>
      <p class="argocd-sso text-muted">
        <i
          class="icon icon-lock mr-5"
          aria-hidden="true"
        />{{ t('argocd.page.sso') }}
        <span class="argocd-url">{{ config.url }}</span>
      </p>

      <h2 class="argocd-subtitle">
        {{ t('argocd.page.shortcuts') }}
      </h2>
      <ul class="argocd-shortcuts">
        <li
          v-for="s in shortcuts"
          :key="s.id"
        >
          <a
            :href="s.href"
            target="_blank"
            rel="noopener noreferrer"
            class="argocd-shortcut"
            :data-testid="`argocd-shortcut-${ s.id }`"
          >
            <i
              :class="['icon', s.icon, 'argocd-shortcut__icon']"
              aria-hidden="true"
            />
            <span class="argocd-shortcut__text">
              <span class="argocd-shortcut__title">{{ t(`argocd.section.${ s.id }.label`) }}</span>
              <span class="argocd-shortcut__desc text-muted">{{ t(`argocd.section.${ s.id }.description`) }}</span>
            </span>
            <i
              class="icon icon-external-link argocd-shortcut__ext"
              aria-hidden="true"
            />
          </a>
        </li>
      </ul>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.argocd-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
}

.argocd-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;

  &__identity {
    display: flex;
    align-items: center;
    gap: 16px;

    h1 {
      margin: 0;
    }

    p {
      margin: 4px 0 0;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 10px;

    :deep(img) {
      width: 100%;
      height: 100%;
    }

    border-radius: var(--border-radius);
    background: var(--box-bg);
    border: 1px solid var(--border);
  }
}

.argocd-sso {
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.argocd-url {
  font-family: monospace;
  margin-left: 8px;
  word-break: break-all;
}

.argocd-subtitle {
  margin: 0;
}

.argocd-shortcuts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.argocd-shortcut {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  height: 100%;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background: var(--body-bg);
  color: var(--body-text);
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
    text-decoration: none;
  }

  &__icon {
    font-size: 20px;
    color: var(--primary);
    margin-top: 2px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__title {
    font-weight: 600;
  }

  &__desc {
    font-size: 13px;
  }

  &__ext {
    opacity: 0.5;
  }
}
</style>
