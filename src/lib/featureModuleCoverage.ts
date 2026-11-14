/**
 * OneSpec SDLC Workbench - Feature Module Coverage Synthesizer
 *
 * Guarantees that every discovered page/route and every distinct API resource group
 * becomes a complete FeatureModuleSurface, so the ISO 26514 user manual never shows
 * only the Login module while other pages and services exist in the project.
 */

import type { CrawledModuleSummary, DiscoveredApiEndpoint, FeatureModuleSurface } from '@/types/sdlc';

const RESOURCE_GROUP_STOPWORDS = new Set([
  'api',
  'v1',
  'v2',
  'v3',
  'auth',
  'graphql',
  'public',
  'internal',
  'rest',
  'service',
  'services',
  'data',
  'admin',
]);

const normalizeRoute = (route: string | undefined): string => {
  const raw = (route || '/').trim();
  if (!raw) return '/';
  const withoutQuery = raw.split('?')[0].split('#')[0];
  const withSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) return withSlash.slice(0, -1);
  return withSlash;
};

const humanizeSegment = (segment: string): string =>
  segment
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const moduleNameFromRoute = (routePath: string): string => {
  const segments = normalizeRoute(routePath)
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) return 'Dashboard Overview';
  return segments.map(humanizeSegment).join(' - ') || 'Dashboard Overview';
};

const resourceGroupOf = (apiPath: string): string | null => {
  const segments = (apiPath || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .filter((segment) => !/^\d+$/.test(segment) && !/^\{.*\}$/.test(segment) && !/^:/.test(segment));
  const candidate = segments.find((segment) => !RESOURCE_GROUP_STOPWORDS.has(segment.toLowerCase()));
  return candidate ? candidate.toLowerCase() : null;
};

const fieldLabelsFromApi = (api: DiscoveredApiEndpoint): string[] => {
  const labels: string[] = [];
  const add = (raw: string) => {
    const clean = raw.replace(/[^\w\s.-]/g, ' ').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length > 48) return;
    const label = humanizeSegment(clean);
    if (label && !labels.some((item) => item.toLowerCase() === label.toLowerCase())) labels.push(label);
  };
  Object.keys(api.queryParameters || {}).forEach(add);
  const requestProperties = (api.requestBodySchema as { properties?: Record<string, unknown> } | null | undefined)?.properties;
  if (requestProperties && typeof requestProperties === 'object') Object.keys(requestProperties).forEach(add);
  return labels.slice(0, 8);
};

const findCoveringModule = (
  surfaces: FeatureModuleSurface[],
  matcher: { routePath?: string; moduleName?: string; resourceGroup?: string; apiPath?: string }
): FeatureModuleSurface | undefined => {
  const targetRoute = matcher.routePath ? normalizeRoute(matcher.routePath) : undefined;
  const targetName = matcher.moduleName?.trim().toLowerCase();
  const group = matcher.resourceGroup?.toLowerCase();
  return surfaces.find((surface) => {
    const surfaceRoute = normalizeRoute(surface.routePath);
    if (targetRoute && surfaceRoute === targetRoute) return true;
    if (targetName && surface.moduleName.trim().toLowerCase() === targetName) return true;
    if (group) {
      const surfaceName = surface.moduleName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const surfaceRouteName = surfaceRoute.toLowerCase().replace(/[^a-z0-9]/g, '');
      const groupName = group.replace(/[^a-z0-9]/g, '');
      if (groupName && (surfaceName.includes(groupName) || surfaceRouteName.includes(groupName))) return true;
      if ((surface.triggeredApis || []).some((api) => resourceGroupOf(api.path) === group)) return true;
    }
    if (matcher.apiPath) {
      const normalizedApiPath = matcher.apiPath.split('?')[0];
      if ((surface.triggeredApis || []).some((api) => api.path.split('?')[0] === normalizedApiPath)) return true;
    }
    return false;
  });
};

const buildSurfaceFromCrawledModule = (
  mod: CrawledModuleSummary,
  targetUrl: string
): Omit<FeatureModuleSurface, 'moduleId'> => {
  const routePath = normalizeRoute(mod.pagePath);
  const hasSearchOrFilter = mod.inputs.some(
    (input) =>
      /search|cari|filter|query/i.test(`${input.name} ${input.placeholder || ''} ${input.labelText || ''}`) ||
      input.type === 'select'
  );
  const formInputs = mod.inputs.map((input, idx) => ({
    id: input.selector || `field_${idx + 1}`,
    name: input.name || `field_${idx + 1}`,
    type: input.type || 'text',
    placeholder: input.placeholder || '',
    labelText: input.labelText,
    required: Boolean(input.required),
    selector: input.selector || '',
  }));
  return {
    moduleName: mod.moduleName || moduleNameFromRoute(routePath),
    routePath,
    fullUrl: `${targetUrl.replace(/\/$/, '')}${routePath === '/' ? '/' : routePath}`,
    pageHeading: mod.headings[0] || mod.moduleName || moduleNameFromRoute(routePath),
    hasDataTable: mod.tables.length > 0,
    tableColumns: Array.from(new Set(mod.tables.flatMap((table) => table.columns).filter(Boolean))),
    sampleRowData: [],
    sampleRows: [],
    hasSearchOrFilter,
    searchFilterSelectors: mod.inputs.map((input) => input.selector).filter(Boolean),
    toolbarButtons: Array.from(new Set(mod.buttons.filter(Boolean))).slice(0, 12),
    subTabsCatalog:
      mod.tabs.length > 0
        ? mod.tabs.map((tab) => ({
            tabName: tab,
            description: `Sub-tab "${tab}" pada modul ${mod.moduleName}.`,
            columnsOrCards: mod.tables.flatMap((table) => table.columns).slice(0, 8),
            actionButtons: [],
          }))
        : undefined,
    formsAndModals:
      formInputs.length > 0
        ? [
            {
              formTitle: `${mod.moduleName || moduleNameFromRoute(routePath)} Form`,
              triggerButtonText: mod.buttons.find((button) => /tambah|create|add|baru|new/i.test(button)),
              inputs: formInputs,
              submitButtonText: mod.buttons.find((button) => /simpan|save|submit|kirim/i.test(button)) || 'Submit',
            },
          ]
        : [],
    triggeredApis: mod.apis.map((api) => ({ method: api.method, path: api.path, status: api.status || 200, latencyMs: 45 })),
    observedAnomalies: [],
  };
};

const buildSurfaceFromPage = (routePath: string, targetUrl: string): Omit<FeatureModuleSurface, 'moduleId'> => {
  const normalized = normalizeRoute(routePath);
  const name = moduleNameFromRoute(normalized);
  return {
    moduleName: name,
    routePath: normalized,
    fullUrl: `${targetUrl.replace(/\/$/, '')}${normalized === '/' ? '/' : normalized}`,
    pageHeading: name,
    hasDataTable: false,
    tableColumns: [],
    sampleRowData: [],
    sampleRows: [],
    hasSearchOrFilter: false,
    searchFilterSelectors: [],
    toolbarButtons: [],
    formsAndModals: [],
    triggeredApis: [],
    observedAnomalies: [],
  };
};

const buildSurfaceFromApiGroup = (
  group: string,
  apis: DiscoveredApiEndpoint[],
  targetUrl: string
): Omit<FeatureModuleSurface, 'moduleId'> => {
  const name = humanizeSegment(group);
  const routePath = normalizeRoute(group);
  const columns = Array.from(new Set(apis.flatMap((api) => fieldLabelsFromApi(api))));
  return {
    moduleName: name,
    routePath,
    fullUrl: `${targetUrl.replace(/\/$/, '')}${routePath}`,
    pageHeading: name,
    hasDataTable: columns.length > 0,
    tableColumns: columns,
    sampleRowData: [],
    sampleRows: [],
    hasSearchOrFilter: columns.length > 0,
    searchFilterSelectors: [],
    toolbarButtons: [],
    formsAndModals: [],
    triggeredApis: apis.map((api) => ({
      method: api.method,
      path: api.path,
      status: 200,
      latencyMs: 45,
    })),
    observedAnomalies: [],
  };
};

const nextModuleId = (usedIds: Set<string>): string => {
  let index = 1;
  while (usedIds.has(`MOD-${String(index).padStart(2, '0')}`)) index += 1;
  const id = `MOD-${String(index).padStart(2, '0')}`;
  usedIds.add(id);
  return id;
};

/**
 * Back-fills missing FeatureModuleSurface entries so every discovered route and API
 * resource group becomes a first-class user manual module.
 */
export function ensureCompleteFeatureModuleCoverage(params: {
  featureModules?: FeatureModuleSurface[];
  discoveredModules?: CrawledModuleSummary[];
  discoveredPages?: string[];
  apiEndpoints?: DiscoveredApiEndpoint[];
  targetUrl?: string;
}): FeatureModuleSurface[] {
  const targetUrl = (params.targetUrl || 'http://localhost:3000/').replace(/\/$/, '');
  const surfaces: FeatureModuleSurface[] = (params.featureModules || []).map((surface) => ({ ...surface }));
  const usedIds = new Set(surfaces.map((surface, idx) => surface.moduleId || `MOD-${String(idx + 1).padStart(2, '0')}`));

  const append = (surface: Omit<FeatureModuleSurface, 'moduleId'>) => {
    surfaces.push({ ...surface, moduleId: nextModuleId(usedIds) });
  };

  for (const mod of params.discoveredModules || []) {
    if (!mod) continue;
    const routePath = normalizeRoute(mod.pagePath || mod.moduleName);
    if (findCoveringModule(surfaces, { routePath, moduleName: mod.moduleName })) continue;
    const looksLikeLoginSurface =
      mod.inputs.some((input) => input.type === 'password') &&
      surfaces.some((surface) => /login|auth|masuk|sign.?in/i.test(`${surface.moduleName} ${surface.routePath}`));
    if (looksLikeLoginSurface && routePath === '/') continue;
    append(buildSurfaceFromCrawledModule(mod, targetUrl));
  }

  for (const page of params.discoveredPages || []) {
    const routePath = normalizeRoute(page);
    if (findCoveringModule(surfaces, { routePath })) continue;
    const crawled = (params.discoveredModules || []).find((mod) => normalizeRoute(mod.pagePath) === routePath);
    const crawledLooksLikeLogin = Boolean(
      crawled && crawled.inputs.some((input) => input.type === 'password')
    );
    const authSurface = surfaces.find((surface) =>
      /login|auth|masuk|sign.?in/i.test(`${surface.moduleName} ${surface.routePath}`)
    );
    if (crawledLooksLikeLogin && authSurface) continue;
    if (crawled) {
      append(buildSurfaceFromCrawledModule(crawled, targetUrl));
      continue;
    }
    append(buildSurfaceFromPage(routePath, targetUrl));
  }

  const groups = new Map<string, DiscoveredApiEndpoint[]>();
  for (const api of params.apiEndpoints || []) {
    const group = resourceGroupOf(api.path);
    if (!group) continue;
    const existing = groups.get(group) || [];
    if (!existing.some((item) => item.method === api.method && item.path === api.path)) existing.push(api);
    groups.set(group, existing);
  }
  for (const [group, apis] of groups) {
    if (findCoveringModule(surfaces, { resourceGroup: group })) continue;
    if (apis.every((api) => /auth|login|session|token/i.test(api.path))) {
      const authCovered = surfaces.some(
        (surface) => /login|auth|masuk|sign.?in/i.test(surface.moduleName) || /login|auth/i.test(surface.routePath)
      );
      if (authCovered) continue;
    }
    append(buildSurfaceFromApiGroup(group, apis, targetUrl));
  }

  return surfaces;
}
