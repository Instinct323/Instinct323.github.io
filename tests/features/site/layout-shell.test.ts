import { describe, expect, it } from 'vitest';
import { buildShellStyle } from '~/features/site/shell';
import type { ShellsConfig } from '~/features/site/types';

const testShellsConfig: ShellsConfig = {
  home: {
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  about: {
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  photography: {
    textStrong: 'var(--shell-text-strong-photography)',
    textBody: 'var(--shell-text-body-photography)',
    textMuted: 'var(--shell-text-muted-photography)',
  },
};

const REMOVED_FORWARDERS = [
  '--page-overlay',
  '--page-overlay-accent-primary',
  '--page-overlay-accent-secondary',
  '--surface-bg',
  '--card-surface-bg',
  '--surface-border',
  '--page-canvas',
];

describe('buildShellStyle', () => {
  it('home shell emits dynamic content width and per-shell text state', () => {
    const result = buildShellStyle('home', 'standard', testShellsConfig);

    expect(result).toContain('--layout-content-width: var(--page-width-standard)');
    expect(result).toContain('--text-strong: var(--shell-home-text-strong)');
    expect(result).toContain('--text-body: var(--shell-home-text-body)');
    expect(result).toContain('--text-muted: var(--shell-home-text-muted)');
  });

  it('about shell emits wide content width and about text state', () => {
    const result = buildShellStyle('about', 'wide', testShellsConfig);

    expect(result).toContain('--layout-content-width: var(--page-width-wide)');
    expect(result).toContain('--text-strong: var(--shell-home-text-strong)');
    expect(result).toContain('--text-body: var(--shell-home-text-body)');
    expect(result).toContain('--text-muted: var(--shell-home-text-muted)');
  });

  it('photography shell emits compact content width and photography-specific text tokens', () => {
    const result = buildShellStyle('photography', 'compact', testShellsConfig);

    expect(result).toContain('--layout-content-width: var(--page-width-compact)');
    expect(result).toContain('--text-strong: var(--shell-text-strong-photography)');
    expect(result).toContain('--text-body: var(--shell-text-body-photography)');
    expect(result).toContain('--text-muted: var(--shell-text-muted-photography)');
  });

  it('unknown shell emits content width only, no shell text tokens', () => {
    const result = buildShellStyle('unknown', 'standard', testShellsConfig);

    expect(result).toContain('--layout-content-width: var(--page-width-standard)');
    expect(result).not.toContain('--text-strong');
    expect(result).not.toContain('--text-body');
    expect(result).not.toContain('--text-muted');
  });

  it('never emits removed static-token forwarders for any shell', () => {
    for (const shell of ['home', 'about', 'photography', 'unknown']) {
      const result = buildShellStyle(shell, 'standard', testShellsConfig);
      for (const forwarder of REMOVED_FORWARDERS) {
        expect(result, `shell "${shell}" should not emit ${forwarder}`).not.toContain(forwarder);
      }
    }
  });

  it('throws on unknown contentWidth token', () => {
    expect(() => buildShellStyle('home', 'custom-var-name', testShellsConfig)).toThrow(
      'Unknown contentWidth token: "custom-var-name". Expected one of: compact, standard, wide.'
    );
  });
});