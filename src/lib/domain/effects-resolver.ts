/**
 * Effects resolver registry — domain-level dependency inversion for effect configs.
 *
 * Plugins register their own resolvers at initialization time.
 * Config loaders call resolveEffectsConfig by name without knowing concrete plugin imports.
 */

export type EffectsResolver = (_config: unknown) => unknown;

const registry = new Map<string, unknown>();

export function registerEffectsResolver(name: string, resolver: EffectsResolver): void {
  registry.set(name, resolver);
}

export function resolveEffectsConfig(name: string, config: unknown): unknown {
  const resolver = registry.get(name) as EffectsResolver | undefined;
  if (!resolver) {
    throw new Error(`No effects resolver registered for "${name}"`);
  }
  return resolver(config);
}

export function getEffectsResolver(name: string): unknown {
  const resolver = registry.get(name);
  if (!resolver) {
    throw new Error(`No effects resolver registered for "${name}"`);
  }
  return resolver;
}

export function resetEffectsRegistry(): void {
  registry.clear();
}
