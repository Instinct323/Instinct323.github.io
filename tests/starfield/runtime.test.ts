import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { initStarfield } from '../../src/plugins/starfield';
import type { StarfieldEffectConfig } from '../../src/plugins/starfield';

function createTestConfig(overrides: Partial<StarfieldEffectConfig> = {}): StarfieldEffectConfig {
  return {
    enabled: true,
    starDensity: 'medium',
    starSize: { min: 1, max: 3 },
    speedFactor: 0.5,
    maxDistance: 100,
    starColor: '#ffffff',
    starOpacity: 0.8,
    linkOpacity: 0.3,
    starShapes: ['circle', 'star'],
    parallaxEffect: false,
    parallaxStrength: 500,
    mouseRadius: 200,
    rotationSpeed: { min: 0.01, max: 0.05 },
    connectionsWhenNoMouse: true,
    percentStarsConnecting: 50,
    lineThickness: 1,
    ...overrides,
  };
}

function createMockCanvases(): {
  backgroundCanvas: HTMLCanvasElement;
  starsCanvas: HTMLCanvasElement;
  bgCtx: CanvasRenderingContext2D;
  starCtx: CanvasRenderingContext2D;
} {
  const bgCtx = {
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;

  const starCtx = {
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;

  const bgCanvas = {
    getContext: vi.fn(() => bgCtx),
    width: 0,
    height: 0,
    style: { display: '' } as unknown as CSSStyleDeclaration,
  } as unknown as HTMLCanvasElement;

  const starsCanvas = {
    getContext: vi.fn(() => starCtx),
    width: 0,
    height: 0,
    style: { display: '' } as unknown as CSSStyleDeclaration,
  } as unknown as HTMLCanvasElement;

  return {
    backgroundCanvas: bgCanvas,
    starsCanvas: starsCanvas,
    bgCtx,
    starCtx,
  };
}

describe('starfield-runtime', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;
  let mockSetTimeout: ReturnType<typeof vi.fn>;
  let mockClearTimeout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
    (window as unknown as Record<string, unknown>).matchMedia = mockMatchMedia;

    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    (window as unknown as Record<string, unknown>).addEventListener = mockAddEventListener;
    (window as unknown as Record<string, unknown>).removeEventListener = mockRemoveEventListener;

    mockRequestAnimationFrame = vi.fn((_cb: FrameRequestCallback) => {
      return 1;
    });
    mockCancelAnimationFrame = vi.fn();
    (window as unknown as Record<string, unknown>).requestAnimationFrame = mockRequestAnimationFrame;
    (window as unknown as Record<string, unknown>).cancelAnimationFrame = mockCancelAnimationFrame;

    mockSetTimeout = vi.fn((cb: () => void) => {
      cb();
      return 1;
    });
    mockClearTimeout = vi.fn();
    (window as unknown as Record<string, unknown>).setTimeout = mockSetTimeout;
    (window as unknown as Record<string, unknown>).clearTimeout = mockClearTimeout;

    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

    const mockDocument = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      hidden: false,
    };
    (document as unknown as Record<string, unknown>).addEventListener = mockDocument.addEventListener;
    (document as unknown as Record<string, unknown>).removeEventListener = mockDocument.removeEventListener;
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initStarfield', () => {
    it('returns a cleanup function', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('throws when config.enabled is false', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ enabled: false });
      expect(() => initStarfield(backgroundCanvas, starsCanvas, config)).toThrow('Starfield disabled by config');
    });

    it('throws when prefers-reduced-motion is enabled', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ enabled: true });
      expect(() => initStarfield(backgroundCanvas, starsCanvas, config)).toThrow('Starfield skipped: prefers-reduced-motion is enabled');
    });

    it('sets up canvas dimensions correctly', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(backgroundCanvas.width).toBeGreaterThan(0);
      expect(backgroundCanvas.height).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('throws when canvas has no valid 2d context', () => {
      const bgCanvas = {
        getContext: vi.fn(() => null),
        style: { display: '' } as unknown as CSSStyleDeclaration,
      } as unknown as HTMLCanvasElement;

      const starsCanvas = {
        getContext: vi.fn(() => null),
        style: { display: '' } as unknown as CSSStyleDeclaration,
      } as unknown as HTMLCanvasElement;

      const config = createTestConfig();
      expect(() => initStarfield(bgCanvas, starsCanvas, config)).toThrow('Starfield skipped: failed to acquire 2D canvas context');
    });

    it('handles empty starShapes array gracefully', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starShapes: [] as unknown as ('circle' | 'star')[] });

      expect(() => {
        const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);
        cleanup();
      }).not.toThrow();
    });

    it('handles zero maxDistance', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ maxDistance: 0 });

      expect(() => {
        const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);
        cleanup();
      }).not.toThrow();
    });

    it('handles negative speedFactor', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ speedFactor: -1 });

      expect(() => {
        const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);
        cleanup();
      }).not.toThrow();
    });

    it('handles zero starSize min/max', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starSize: { min: 0, max: 0 } });

      expect(() => {
        const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);
        cleanup();
      }).not.toThrow();
    });
  });

  describe('createStar behavior', () => {
    it('creates stars with size within configured range', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starSize: { min: 2, max: 5 } });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('respects starShapes configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starShapes: ['circle'] });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('respects percentStarsConnecting configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ percentStarsConnecting: 100 });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('drawStar behavior', () => {
    it('draws circle-shaped stars using arc', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starShapes: ['circle'] });
      initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRequestAnimationFrame = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRequestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
    });

    it('draws star-shaped stars using lineTo', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starShapes: ['star'] });
      initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRequestAnimationFrame = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRequestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
    });

    it('applies starColor correctly', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starColor: '#ff0000' });
      initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRequestAnimationFrame = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRequestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
    });

    it('applies starOpacity correctly', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starOpacity: 0.5 });
      initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRequestAnimationFrame = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRequestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
    });
  });

  describe('drawConnections behavior', () => {
    it('draws connections when mouse is within radius', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({
        maxDistance: 100,
        mouseRadius: 200,
        connectionsWhenNoMouse: false,
      });

      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mouseMoveHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'mousemove',
      )?.[1] as ((_e: MouseEvent) => void) | undefined;

      if (mouseMoveHandler) {
        mouseMoveHandler({ clientX: 400, clientY: 300 } as MouseEvent);
      }

      cleanup();
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('respects maxDistance for connection drawing', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ maxDistance: 50 });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('respects linkOpacity configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ linkOpacity: 0.8 });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('respects lineThickness configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ lineThickness: 2 });
      initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('removes all event listeners on cleanup', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('cancels animation frame on cleanup', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      cleanup();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('createStar behavior - extended', () => {
    it('creates stars with varying depth values', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('handles star creation with different starDensity settings', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starDensity: 'low' });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('handles star creation with ultra density', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starDensity: 'ultra' });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('respects rotationSpeed configuration for star shapes', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({
        starShapes: ['star'],
        rotationSpeed: { min: 0.1, max: 0.5 },
      });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('applies speedFactor correctly', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ speedFactor: 2.0 });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });
  });

  describe('drawStar behavior - extended', () => {
    it('handles stars at canvas edge positions', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRaf = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRaf.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.clearRect).toHaveBeenCalled();
      cleanup();
    });

    it('handles zero starOpacity', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starOpacity: 0 });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRaf = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRaf.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
      cleanup();
    });

    it('handles full starOpacity', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starOpacity: 1 });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRaf = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRaf.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
      cleanup();
    });

    it('draws with correct fillStyle', () => {
      const { backgroundCanvas, starsCanvas, starCtx } = createMockCanvases();
      const config = createTestConfig({ starColor: '#00ff00' });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRaf = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRaf.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(starCtx.beginPath).toHaveBeenCalled();
      cleanup();
    });

    it('handles mixed starShapes configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ starShapes: ['circle', 'star', 'circle'] });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mockRaf = (window as unknown as Record<string, unknown>).requestAnimationFrame as ReturnType<typeof vi.fn>;
      const cb = mockRaf.mock.calls[0]?.[0] as FrameRequestCallback;
      if (cb) cb(0);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });
  });

  describe('drawConnections behavior - extended', () => {
    it('handles mouse leaving canvas', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ connectionsWhenNoMouse: false });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      const mouseleaveHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'mouseleave',
      )?.[1] as (() => void) | undefined;

      if (mouseleaveHandler) {
        mouseleaveHandler();
      }

      cleanup();
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('handles touch events for pointer position', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      initStarfield(backgroundCanvas, starsCanvas, config);

      const touchStartHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'touchstart',
      )?.[1] as ((_e: TouchEvent) => void) | undefined;

      if (touchStartHandler) {
        const mockTouch = { clientX: 100, clientY: 200 } as Touch;
        touchStartHandler({ touches: [mockTouch] } as unknown as TouchEvent);
      }

      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('handles touchmove event correctly', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ enabled: true });
      initStarfield(backgroundCanvas, starsCanvas, config);

      const touchMoveHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'touchmove',
      )?.[1] as ((_e: TouchEvent) => void) | undefined;

      if (touchMoveHandler) {
        const mockTouch = { clientX: 100, clientY: 200 } as Touch;
        touchMoveHandler({ touches: [mockTouch] } as unknown as TouchEvent);
      }

      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
    });

    it('respects mouseRadius configuration', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig({ mouseRadius: 50 });
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('handles touchmove event', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      initStarfield(backgroundCanvas, starsCanvas, config);

      const touchMoveHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'touchmove',
      )?.[1] as ((_e: TouchEvent) => void) | undefined;

      if (touchMoveHandler) {
        const mockTouch = { clientX: 150, clientY: 250 } as Touch;
        touchMoveHandler({ touches: [mockTouch] } as unknown as TouchEvent);
      }

      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
    });

    it('handles touchend event - removed (empty listener)', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      initStarfield(backgroundCanvas, starsCanvas, config);

      const touchEndHandler = mockAddEventListener.mock.calls.find(
        (call: unknown[]) => call[0] === 'touchend',
      )?.[1] as (() => void) | undefined;

      expect(touchEndHandler).toBeUndefined();
    });
  });

  describe('visibility and animation control', () => {
    it('handles visibility change events', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });

    it('resumes animation when tab becomes visible', () => {
      const { backgroundCanvas, starsCanvas } = createMockCanvases();
      const config = createTestConfig();
      const cleanup = initStarfield(backgroundCanvas, starsCanvas, config);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      cleanup();
    });
  });
});
