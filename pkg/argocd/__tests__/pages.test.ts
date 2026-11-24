import { flushPromises, mount } from '@vue/test-utils';
import ArgoCDHome from '../pages/ArgoCDHome.vue';
import ArgoCDEmbed from '../pages/ArgoCDEmbed.vue';
import { resetArgoConfigCache } from '../composables/useArgoConfig';

const mockRoute: { params: Record<string, string> } = { params: {} };
const mockReplace = jest.fn();

jest.mock('vue-router', () => ({
  useRoute:  () => mockRoute,
  useRouter: () => ({ replace: mockReplace }),
}));

const setConfig = (metadata: Record<string, string> | null, ok = true) => {
  resetArgoConfigCache();
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json:   async() => ({ entries: metadata ? { argocd: { name: 'argocd', metadata } } : {} }),
  }) as unknown as typeof fetch;
};

const mountPage = async(component: unknown, isAdmin = false) => {
  const wrapper = mount(component as any, { // eslint-disable-line @typescript-eslint/no-explicit-any
    global: {
      provide: { store: { getters: { 'auth/isAdmin': isAdmin, 'i18n/t': (key: string) => key } } },
      stubs:   {
        IconOrSvg: { template: '<span />' },
        Loading:   { template: '<div data-testid="loading" />' },
        Banner:    { props: ['label'], template: '<div class="banner">{{ label }}</div>' }
      },
    },
  });

  await flushPromises();

  return wrapper;
};

beforeEach(() => {
  mockReplace.mockReset();
  mockRoute.params = { cluster: '_' };
});

describe('ArgoCDHome (landing page, no side nav)', () => {
  it('link mode: shows the open button and section shortcuts as safe external links', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com' });
    const wrapper = await mountPage(ArgoCDHome);

    expect(wrapper.find('[data-testid="argocd-open"]').attributes('href')).toBe('https://argocd.example.com');
    const repos = wrapper.find('[data-testid="argocd-shortcut-repos"]');

    expect(repos.attributes('href')).toBe('https://argocd.example.com/settings/repos');
    expect(repos.attributes('target')).toBe('_blank');
    expect(repos.attributes('rel')).toContain('noopener');
    expect(wrapper.find('[data-testid="argocd-shortcut-accounts"]').exists()).toBe(false);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('embed mode: redirects to the embedded Applications section', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com', 'argocd-embed': 'true' });
    await mountPage(ArgoCDHome);

    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({
      name:   'argocd-c-cluster-section',
      params: expect.objectContaining({ section: 'applications', cluster: '_' }),
    }));
  });

  it('not configured: shows the how-to to admins only', async() => {
    setConfig(null);
    const admin = await mountPage(ArgoCDHome, true);

    expect(admin.find('.argocd-howto').text()).toContain('argocd-url');
    expect(admin.find('[data-testid="argocd-open"]').exists()).toBe(false);

    setConfig(null);
    const user = await mountPage(ArgoCDHome, false);

    expect(user.find('.argocd-howto').exists()).toBe(false);
  });

  it('never renders a javascript: url', async() => {
    setConfig({ 'argocd-url': 'javascript:alert(1)' });
    const wrapper = await mountPage(ArgoCDHome);

    expect(wrapper.findAll('a')).toHaveLength(0);
    expect(wrapper.find('.banner').text()).toContain('argocd.page.invalidUrl');
  });
});

describe('ArgoCDEmbed (side nav = Argo CD navigation)', () => {
  it('loads the requested section in the iframe', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com/', 'argocd-embed': 'true' });
    mockRoute.params = { cluster: '_', section: 'clusters' };
    const wrapper = await mountPage(ArgoCDEmbed);

    expect(wrapper.find('iframe').attributes('src')).toBe('https://argocd.example.com/settings/clusters');
    expect(wrapper.find('[data-testid="argocd-open-tab"]').attributes('href')).toBe('https://argocd.example.com/settings/clusters');
  });

  it('falls back to Applications for an unknown section', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com', 'argocd-embed': 'true' });
    mockRoute.params = { cluster: '_', section: 'does-not-exist' };
    const wrapper = await mountPage(ArgoCDEmbed);

    expect(wrapper.find('iframe').attributes('src')).toBe('https://argocd.example.com/applications');
  });

  it('reload re-creates the iframe', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com', 'argocd-embed': 'true' });
    mockRoute.params = { cluster: '_', section: 'applications' };
    const wrapper = await mountPage(ArgoCDEmbed);
    const before = wrapper.find('iframe').element;

    await wrapper.find('[data-testid="argocd-reload"]').trigger('click');
    expect(wrapper.find('iframe').element).not.toBe(before);
  });

  it('link mode: redirects to the landing page', async() => {
    setConfig({ 'argocd-url': 'https://argocd.example.com' });
    mockRoute.params = { cluster: '_', section: 'repos' };
    const wrapper = await mountPage(ArgoCDEmbed);

    expect(wrapper.find('iframe').exists()).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ name: 'argocd-c-cluster' }));
  });
});
