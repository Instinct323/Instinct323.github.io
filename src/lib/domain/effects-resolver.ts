/**
 * Effects resolver registry — domain-level dependency inversion for effect configs.
 *
 * Plugins register their own resolvers at initialization time.
 * Config loaders call getEffectsResolver by name without knowing concrete plugin imports.
 */

const registry = new Map<string, (_config: unknown) => unknown>();

export function registerEffectsResolver<T>(name: string, resolver: (_config: unknown) => T): void {
  registry.set(name, resolver as (_config: unknown) => unknown);
}

export function getEffectsResolver<T>(name: string): (_config: unknown) => T {
  const resolver = registry.get(name);
  if (!resolver) {
    throw new Error(
      `No effects resolver registered for "${name}". Available: [${Array.from(registry.keys()).join(', ')}]`,
    );
  }
  return resolver as (_config: unknown) => T;
}

export function resetEffectsRegistry(): void {
  registry.clear();
}
