import { configFromUIPlugins, fetchArgoConfig, parseArgoUrl, UI_PLUGINS_URL } from '../config';

describe('parseArgoUrl', () => {
  it.each([
    ['https://argocd.example.com', 'https://argocd.example.com'],
    ['https://argocd.example.com/', 'https://argocd.example.com'],
    ['  http://argocd.lan:8080/argo/  ', 'http://argocd.lan:8080/argo'],
  ])('accepts %s', (raw, expected) => {
    expect(parseArgoUrl(raw)).toBe(expected);
  });

  it.each([
    [undefined], [''], ['   '], ['argocd.example.com'], ['javascript:alert(1)'], ['ftp://x'], [42],
  ])('rejects %p', (raw) => {
    expect(parseArgoUrl(raw)).toBeUndefined();
  });
});

describe('configFromUIPlugins', () => {
  it('reads url and embed from our entry', () => {
    expect(configFromUIPlugins({
      entries: {
        other:  { name: 'other', metadata: {} },
        argocd: { name: 'argocd', metadata: { 'argocd-url': 'https://a.example.com/', 'argocd-embed': 'true' } },
      }
    })).toStrictEqual({
      url: 'https://a.example.com', invalidUrl: undefined, embed: true
    });
  });

  it('finds the entry when the release has another name', () => {
    expect(configFromUIPlugins({ Entries: { custom: { name: 'custom', metadata: { 'argocd-url': 'https://b.example.com' } } } }).url)
      .toBe('https://b.example.com');
  });

  it('reports an invalid url', () => {
    expect(configFromUIPlugins({ entries: { argocd: { name: 'argocd', metadata: { 'argocd-url': 'javascript:alert(1)' } } } }))
      .toStrictEqual({
        url: undefined, invalidUrl: 'javascript:alert(1)', embed: false
      });
  });

  it('handles missing configuration', () => {
    expect(configFromUIPlugins(undefined)).toStrictEqual({
      url: undefined, invalidUrl: undefined, embed: false
    });
    expect(configFromUIPlugins({ entries: { argocd: { name: 'argocd' } } }).url).toBeUndefined();
  });
});

describe('fetchArgoConfig', () => {
  it('fetches /v1/uiplugins', async() => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok:   true,
      json: async() => ({ entries: { argocd: { name: 'argocd', metadata: { 'argocd-url': 'https://c.example.com' } } } }),
    });

    await expect(fetchArgoConfig(fetchFn as unknown as typeof fetch)).resolves.toMatchObject({ url: 'https://c.example.com' });
    expect(fetchFn).toHaveBeenCalledWith(UI_PLUGINS_URL, expect.objectContaining({ credentials: 'same-origin' }));
  });

  it('throws on HTTP errors', async() => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(fetchArgoConfig(fetchFn as unknown as typeof fetch)).rejects.toThrow('503');
  });
});
