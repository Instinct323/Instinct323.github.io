import { resolveStarfieldEffectConfig } from '~/plugins/starfield';

export interface SiteEffectsConfig {
  starfield: unknown;
}

const EFFECTS_RESOLVERS: Record<string, (_config: unknown) => unknown> = {
  starfield: resolveStarfieldEffectConfig as (_config: unknown) => unknown,
};

export function getEffectsResolver<T>(name: string): (_config: unknown) => T {
  const resolver = EFFECTS_RESOLVERS[name];
  if (!resolver) {
    throw new Error(
      `No effects resolver registered for "${name}". Available: [${Object.keys(EFFECTS_RESOLVERS).join(', ')}]`,
    );
  }
  return resolver as (_config: unknown) => T;
}
