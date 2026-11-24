import { ARGO_SECTIONS, DEFAULT_SECTION, sectionById, sectionUrl } from '../sections';

describe('sections', () => {
  it('has unique ids and absolute Argo CD paths', () => {
    const ids = ARGO_SECTIONS.map((s) => s.id);

    expect(new Set(ids).size).toBe(ids.length);
    ARGO_SECTIONS.forEach((s) => expect(s.path).toMatch(/^\/[a-z/-]+$/));
  });

  it('falls back to Applications for unknown sections', () => {
    expect(sectionById('repos').path).toBe('/settings/repos');
    expect(sectionById('nope')).toBe(DEFAULT_SECTION);
    expect(sectionById(undefined).id).toBe('applications');
  });

  it('builds section urls from the base url', () => {
    expect(sectionUrl('https://argocd.example.com/', sectionById('clusters'))).toBe('https://argocd.example.com/settings/clusters');
    expect(sectionUrl('https://x.example.com/argo', sectionById('applications'))).toBe('https://x.example.com/argo/applications');
  });
});
