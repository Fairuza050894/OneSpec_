/**
 * Anti-blank-screen sanitizer for FeatureModuleSurface screenshots.
 *
 * Server and browser call the same blueprint builder; only the blank predicate
 * differs (sharp on the server, canvas sampling in the browser). Keeping this in
 * `src/lib` means the pure helper stays importable from client components.
 */

import type { FeatureModuleSurface, ScreenControlCatalogItem } from '@/types/sdlc';
import { buildFeatureModuleBlueprintSvgDataUrl } from './featureModuleBlueprint';

export type ScreenshotBlankCheck = (dataUrl: string | undefined | null) => Promise<boolean> | boolean;

const isFilterControl = (control: ScreenControlCatalogItem): boolean =>
  control.controlType === 'FILTER_CONTROL' || control.controlType === 'SEARCH_INPUT';

export function buildBlueprintForSurface(mod: FeatureModuleSurface): string {
  const controls = mod.screenControlsCatalog || [];
  const buttons = controls
    .filter((control) => !isFilterControl(control))
    .map((control) => ({
      buttonName: control.controlName,
      screenLocation: control.screenLocation,
      primaryPurpose: control.availableOptionsOrSample,
    }));
  const filters = controls
    .filter(isFilterControl)
    .map((control) => ({
      filterName: control.controlName,
      controlType: control.controlType,
      sampleValues: control.availableOptionsOrSample,
    }));
  return buildFeatureModuleBlueprintSvgDataUrl(mod, buttons, filters);
}

/**
 * Replaces pixel-uniform or missing captures with the deterministic ISO 26514
 * blueprint. Returns a new array; untouched modules keep their original object.
 */
export async function sanitizeFeatureModuleScreenshots(
  modules: FeatureModuleSurface[],
  isBlank: ScreenshotBlankCheck
): Promise<FeatureModuleSurface[]> {
  if (!modules?.length) return modules;
  return Promise.all(
    modules.map(async (mod) => {
      const blank = await isBlank(mod.screenshotDataUrl);
      if (!blank) return mod;
      return { ...mod, screenshotDataUrl: buildBlueprintForSurface(mod) };
    })
  );
}
