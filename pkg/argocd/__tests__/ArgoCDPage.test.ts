import { flushPromises, shallowMount } from '@vue/test-utils';
import ArgoCDPage from '../pages/ArgoCDPage.vue';

const mountWith = async(metadata: Record<string, string> | null, { isAdmin = false, ok = true } = {}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json:   async() => ({ entries: metadata ? { argocd: { name: 'argocd', metadata } } : {} }),
  }) as unknown as typeof fetch;

  const wrapper = shallowMount(ArgoCDPage, {
    global: {
      provide: {
        store: {
          getters: {
            'auth/isAdmin': isAdmin,
            'i18n/t':       (key: string) => key,
          }
        }
      }
    }
  });

  await flushPromises();

  return wrapper;
};

describe('ArgoCDPage', () => {
  it('renders a safe external link when configured', async() => {
    const wrapper = await mountWith({ 'argocd-url': 'https://argocd.example.com' });
    const link = wrapper.find('a.role-primary');

    expect(link.attributes('href')).toBe('https://argocd.example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
    expect(wrapper.find('iframe').exists()).toBe(false);
  });

  it('embeds Argo CD in an iframe when argocd-embed is true', async() => {
    const wrapper = await mountWith({ 'argocd-url': 'https://argocd.example.com', 'argocd-embed': 'true' });

    expect(wrapper.find('iframe').attributes('src')).toBe('https://argocd.example.com');
  });

  it('shows the how-to to admins when not configured', async() => {
    const wrapper = await mountWith(null, { isAdmin: true });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('.argocd-howto').text()).toContain('plugin.metadata.argocd-url');
  });

  it('hides the how-to from standard users', async() => {
    const wrapper = await mountWith(null);

    expect(wrapper.find('.argocd-howto').exists()).toBe(false);
  });

  it('never renders a javascript: url', async() => {
    const wrapper = await mountWith({ 'argocd-url': 'javascript:alert(1)' });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('iframe').exists()).toBe(false);
  });
});
