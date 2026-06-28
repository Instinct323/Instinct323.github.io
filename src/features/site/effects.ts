import { resolveStarfieldEffectConfig } from '~/plugins/starfield';

export interface SiteEffectsConfig {
  starfield: unknown;
}

/**
 * Direct resolver lookup table. Kept as a named export (not a wrapper function)
 * because there is only one effect registered today; the dictionary form is the
 * "fake abstraction" pattern. If a second resolver is added, expose the dictionary
 * directly to call sites — do not reintroduce a getEffectsResolver() helper.
 */
export const EFFECTS_RESOLVERS: Record<string, (_config: unknown) => unknown> = {
  starfield: resolveStarfieldEffectConfig as (_config: unknown) => unknown,
};
