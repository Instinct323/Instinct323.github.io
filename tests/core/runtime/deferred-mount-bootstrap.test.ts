import { describe, expect, it } from 'vitest';
import { resolveDeferredMountRuntimeConfig } from '~/core/runtime/deferred-mount-init';
import type { DeferredImageLazyLoadConfig } from '~/features/site/page-load';

describe('resolveDeferredMountRuntimeConfig', () => {
  const validLazyLoadConfig: DeferredImageLazyLoadConfig = {
    rootMargin: '200px',
    localDebugDelayMs: 500,
  };

  describe('normal cases', () => {
    it('returns correct config when isDev is false', () => {
      const result = resolveDeferredMountRuntimeConfig(validLazyLoadConfig, false);
      
      expect(result).toEqual({
        rootMargin: '200px',
        mountDelayMs: 0,
      });
    });

    it('returns correct config when isDev is true', () => {
      const result = resolveDeferredMountRuntimeConfig(validLazyLoadConfig, true);
      
      expect(result).toEqual({
        rootMargin: '200px',
        mountDelayMs: 500,
      });
    });

    it('handles different rootMargin values', () => {
      const config: DeferredImageLazyLoadConfig = {
        rootMargin: '0px 0px 200px 0px',
        localDebugDelayMs: 1000,
      };

      const result = resolveDeferredMountRuntimeConfig(config, false);
      
      expect(result.rootMargin).toBe('0px 0px 200px 0px');
      expect(result.mountDelayMs).toBe(0);
    });

    it('handles zero localDebugDelayMs in dev mode', () => {
      const config: DeferredImageLazyLoadConfig = {
        rootMargin: '100px',
        localDebugDelayMs: 0,
      };

      const result = resolveDeferredMountRuntimeConfig(config, true);
      
      expect(result.mountDelayMs).toBe(0);
    });

    it('handles large localDebugDelayMs values', () => {
      const config: DeferredImageLazyLoadConfig = {
        rootMargin: '50px',
        localDebugDelayMs: 10000,
      };

      const result = resolveDeferredMountRuntimeConfig(config, true);
      
      expect(result.mountDelayMs).toBe(10000);
    });
  });

  describe('edge cases: missing or invalid parameters', () => {
    it('throws TypeError when lazyLoad is null', () => {
      expect(() => resolveDeferredMountRuntimeConfig(null as any, false)).toThrow(TypeError);
    });

    it('throws TypeError when lazyLoad is undefined', () => {
      expect(() => resolveDeferredMountRuntimeConfig(undefined as any, false)).toThrow(TypeError);
    });

    it('handles undefined rootMargin without throwing', () => {
      const config = {
        rootMargin: undefined,
        localDebugDelayMs: 100,
      };
      const result = resolveDeferredMountRuntimeConfig(config as any, false);
      expect(result.rootMargin).toBeUndefined();
    });

    it('handles null rootMargin without throwing', () => {
      const config = {
        rootMargin: null,
        localDebugDelayMs: 100,
      };
      const result = resolveDeferredMountRuntimeConfig(config as any, false);
      expect(result.rootMargin).toBeNull();
    });

    it('handles empty string rootMargin', () => {
      const config: DeferredImageLazyLoadConfig = {
        rootMargin: '',
        localDebugDelayMs: 100,
      };
      
      const result = resolveDeferredMountRuntimeConfig(config, false);
      expect(result.rootMargin).toBe('');
    });

    it('handles negative localDebugDelayMs in dev mode', () => {
      const config: DeferredImageLazyLoadConfig = {
        rootMargin: '100px',
        localDebugDelayMs: -100,
      };
      
      const result = resolveDeferredMountRuntimeConfig(config, true);
      expect(result.mountDelayMs).toBe(-100);
    });

    it('handles non-numeric localDebugDelayMs in dev mode', () => {
      const config = {
        rootMargin: '100px',
        localDebugDelayMs: '500' as any,
      };
      
      const result = resolveDeferredMountRuntimeConfig(config, true);
      expect(result.mountDelayMs).toBe('500');
    });
  });

  describe('type correctness', () => {
    it('returns DeferredMountRuntimeConfig type', () => {
      const result = resolveDeferredMountRuntimeConfig(validLazyLoadConfig, true);
      
      expect(typeof result.rootMargin).toBe('string');
      expect(typeof result.mountDelayMs).toBe('number');
    });

    it('preserves exact rootMargin string', () => {
      const testCases = [
        '200px',
        '0px',
        '50px 100px',
        '10% 20% 30% 40%',
        '-100px',
      ];

      testCases.forEach(rootMargin => {
        const config: DeferredImageLazyLoadConfig = {
          rootMargin,
          localDebugDelayMs: 100,
        };
        const result = resolveDeferredMountRuntimeConfig(config, false);
        expect(result.rootMargin).toBe(rootMargin);
      });
    });
  });
});
