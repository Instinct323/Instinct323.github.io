import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { initShellBackground } from '~/core/runtime/layout';

const SHELL_BACKGROUND_CACHE_KEY = 'site-shell-background-payload-v1';

function createSiteFrame(payload: { mobileSrc: string; desktopSrc: string }): HTMLElement {
  const frame = document.createElement('div');
  frame.className = 'site-frame';
  frame.dataset.shellBackground = JSON.stringify(payload);
  document.body.appendChild(frame);
  return frame;
}

describe('initShellBackground', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('applies current payload when cache is missing', () => {
    const payload = { mobileSrc: '/mobile.jpg', desktopSrc: '/desktop.jpg' };
    createSiteFrame(payload);
    initShellBackground();
    expect(document.body.style.getPropertyValue('--page-bg-image-mobile')).toBe(`url('/mobile.jpg')`);
    expect(document.body.style.getPropertyValue('--page-bg-image-desktop')).toBe(`url('/desktop.jpg')`);
    expect(sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY)).toBe(JSON.stringify(payload));
  });

  it('reuses cache when payload matches exactly', () => {
    const payload = { mobileSrc: '/mobile.jpg', desktopSrc: '/desktop.jpg' };
    sessionStorage.setItem(SHELL_BACKGROUND_CACHE_KEY, JSON.stringify(payload));
    createSiteFrame(payload);
    initShellBackground();
    expect(document.body.style.getPropertyValue('--page-bg-image-mobile')).toBe(`url('/mobile.jpg')`);
    expect(sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY)).toBe(JSON.stringify(payload));
  });

  it('applies current payload and overwrites cache when payload mismatches', () => {
    const oldPayload = { mobileSrc: '/old-mobile.jpg', desktopSrc: '/old-desktop.jpg' };
    const newPayload = { mobileSrc: '/new-mobile.jpg', desktopSrc: '/new-desktop.jpg' };
    sessionStorage.setItem(SHELL_BACKGROUND_CACHE_KEY, JSON.stringify(oldPayload));
    createSiteFrame(newPayload);
    initShellBackground();
    expect(document.body.style.getPropertyValue('--page-bg-image-mobile')).toBe(`url('/new-mobile.jpg')`);
    expect(document.body.style.getPropertyValue('--page-bg-image-desktop')).toBe(`url('/new-desktop.jpg')`);
    expect(sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY)).toBe(JSON.stringify(newPayload));
  });

  it('applies current payload when cache is corrupt', () => {
    sessionStorage.setItem(SHELL_BACKGROUND_CACHE_KEY, 'not-json');
    const payload = { mobileSrc: '/mobile.jpg', desktopSrc: '/desktop.jpg' };
    createSiteFrame(payload);
    expect(() => initShellBackground()).not.toThrow();
    expect(document.body.style.getPropertyValue('--page-bg-image-mobile')).toBe(`url('/mobile.jpg')`);
    expect(sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY)).toBe(JSON.stringify(payload));
  });

  it('applies current payload when storage is inaccessible', () => {
    const payload = { mobileSrc: '/mobile.jpg', desktopSrc: '/desktop.jpg' };
    createSiteFrame(payload);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => initShellBackground()).not.toThrow();
    expect(document.body.style.getPropertyValue('--page-bg-image-mobile')).toBe(`url('/mobile.jpg')`);
  });

  it('silently returns when no site frame exists', () => {
    expect(() => initShellBackground()).not.toThrow();
  });
});
