import { describe, expect, it } from 'vitest';
import { buildShellStyle } from '../../../src/lib/domain/layout-shell';

describe('buildShellStyle', () => {
  it('buildShellStyle("home", "standard") contains home shell tokens and standard content width', () => {
    const result = buildShellStyle('home', 'standard');

    expect(result).toContain('--layout-content-width: var(--page-width-standard)');
    expect(result).toContain('--page-overlay: var(--page-overlay)');
    expect(result).toContain('--page-overlay-accent-primary: var(--shell-hero-accent-primary)');
    expect(result).toContain('--page-overlay-accent-secondary: var(--shell-hero-accent-secondary)');
    expect(result).toContain('--surface-bg: var(--shell-elevated-surface-bg)');
    expect(result).toContain('--card-surface-bg: var(--shell-elevated-card-bg)');
    expect(result).toContain('--surface-border: var(--shell-elevated-surface-border)');
    expect(result).toContain('--page-canvas: var(--shell-elevated-canvas)');
    expect(result).toContain('--text-strong: var(--shell-home-text-strong)');
    expect(result).toContain('--text-body: var(--shell-home-text-body)');
    expect(result).toContain('--text-muted: var(--shell-home-text-muted)');
  });

  it('buildShellStyle("about", "wide") contains about shell tokens and wide content width', () => {
    const result = buildShellStyle('about', 'wide');

    expect(result).toContain('--layout-content-width: var(--page-width-wide)');
    expect(result).toContain('--page-overlay: var(--page-overlay)');
    expect(result).toContain('--page-overlay-accent-primary: var(--shell-hero-accent-primary)');
    expect(result).toContain('--page-overlay-accent-secondary: var(--shell-hero-accent-secondary)');
    expect(result).toContain('--surface-bg: var(--shell-elevated-surface-bg)');
    expect(result).toContain('--card-surface-bg: var(--shell-elevated-card-bg)');
    expect(result).toContain('--surface-border: var(--shell-elevated-surface-border)');
    expect(result).toContain('--page-canvas: var(--shell-elevated-canvas)');
    expect(result).toContain('--text-strong: var(--shell-home-text-strong)');
    expect(result).toContain('--text-body: var(--shell-home-text-body)');
    expect(result).toContain('--text-muted: var(--shell-home-text-muted)');
  });

  it('buildShellStyle("photography", "compact") contains photography-specific text tokens', () => {
    const result = buildShellStyle('photography', 'compact');

    expect(result).toContain('--layout-content-width: var(--page-width-compact)');
    expect(result).toContain('--page-overlay: var(--page-overlay)');
    expect(result).toContain('--text-strong: var(--shell-text-strong-photography)');
    expect(result).toContain('--text-body: var(--shell-text-body-photography)');
    expect(result).toContain('--text-muted: var(--shell-text-muted-photography)');
    expect(result).toContain('--surface-bg: var(--shell-elevated-surface-bg)');
    expect(result).toContain('--page-canvas: var(--shell-elevated-canvas)');
  });

  it('buildShellStyle("unknown", "standard") returns content width only (no shell tokens)', () => {
    const result = buildShellStyle('unknown', 'standard');

    expect(result).toContain('--layout-content-width: var(--page-width-standard)');
    expect(result).toContain('--page-overlay: var(--page-overlay)');
    expect(result).not.toContain('--page-overlay-accent-primary');
    expect(result).not.toContain('--surface-bg');
    expect(result).not.toContain('--text-strong');
  });

  it('buildShellStyle("home", "custom-var-name") passes through custom content width as-is', () => {
    const result = buildShellStyle('home', 'custom-var-name');

    expect(result).toContain('--layout-content-width: custom-var-name');
    expect(result).not.toContain('--layout-content-width: var(--page-width');
    expect(result).toContain('--text-strong: var(--shell-home-text-strong)');
  });
});
