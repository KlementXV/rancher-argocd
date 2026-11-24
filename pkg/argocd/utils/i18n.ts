import { useShellStore } from './store';

export type Translate = (key: string, args?: Record<string, unknown>) => string;

/** Non-escaping translator for mustache/attribute bindings (shell's global `t` HTML-escapes). */
export function useTranslation(): Translate {
  const store = useShellStore();

  return (key, args) => store.getters['i18n/t'](key, args);
}
