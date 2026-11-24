import { init, SECTION_ROUTE } from '../product';
import { ARGO_SECTIONS, navTypeName, SETTINGS_GROUP } from '../sections';

describe('product.init', () => {
  const dsl = {
    product:     jest.fn(),
    virtualType: jest.fn(),
    basicType:   jest.fn(),
    weightType:  jest.fn(),
    weightGroup: jest.fn(),
  };
  const plugin = { DSL: jest.fn(() => dsl) };

  beforeAll(() => init(plugin as any, {} as any)); // eslint-disable-line @typescript-eslint/no-explicit-any

  it('registers a top-level product in the management store (next to Fleet)', () => {
    expect(dsl.product).toHaveBeenCalledWith(expect.objectContaining({ inStore: 'management', showClusterSwitcher: false }));
  });

  it('adds one side nav entry per Argo CD section, routed to the section page', () => {
    expect(dsl.virtualType).toHaveBeenCalledTimes(ARGO_SECTIONS.length);
    expect(dsl.virtualType).toHaveBeenCalledWith(expect.objectContaining({
      name:     'argocd-nav-repos',
      labelKey: 'argocd.section.repos.label',
      route:    expect.objectContaining({ name: SECTION_ROUTE, params: expect.objectContaining({ section: 'repos' }) }),
    }));
  });

  it('groups settings sections under the Settings group', () => {
    const settings = ARGO_SECTIONS.filter((s) => s.group === 'settings').map(navTypeName);

    expect(dsl.basicType).toHaveBeenCalledWith(settings, SETTINGS_GROUP);
    expect(dsl.basicType).toHaveBeenCalledWith(expect.arrayContaining(['argocd-nav-applications', 'argocd-nav-help']));
  });
});
