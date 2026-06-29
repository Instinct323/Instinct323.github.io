import type { StarfieldEffectConfig } from './types';
import {
  parseHexColorOrDefault,
  calculateDistance,
  randomRange,
  getOrCreateCell,
  calculateConnectionOpacity,
  DPR_CAP,
  IDLE_RESTART_TIME,
  STAR_POINTS,
  starDensities,
  type CellGrid,
  type Star,
} from './utils';

interface PointerState {
  x: number | null;
  y: number | null;
}

interface StarfieldState {
  stars: Star[];
  cells: CellGrid;
  pointer: PointerState;
  rafId: number;
  idleTimeoutId: ReturnType<typeof setTimeout> | null;
  width: number;
  height: number;
  isVisible: boolean;
}

export interface StarfieldContext {
  backgroundCanvas: HTMLCanvasElement;
  starsCanvas: HTMLCanvasElement;
  config: StarfieldEffectConfig;
  ctxBg: CanvasRenderingContext2D;
  ctxSt: CanvasRenderingContext2D;
  starRgb: { r: number; g: number; b: number };
  cellSize: number;
}

function createStar(x: number, y: number, config: StarfieldEffectConfig): Star {
  const size = randomRange(config.starSize.min, config.starSize.max);
  const shape = config.starShapes[Math.floor(Math.random() * config.starShapes.length)] as 'circle' | 'star';
  const speedX = (Math.random() - 0.5) * config.speedFactor;
  const speedY = (Math.random() - 0.5) * config.speedFactor;
  const rotationSpeed = randomRange(config.rotationSpeed.min, config.rotationSpeed.max);
  const depth = Math.random();
  // Connection-gating interaction:
  //   - `connectionsWhenNoMouse` is the master switch (false = no connections ever)
  //   - `percentStarsConnecting` controls probabilistic connection eligibility per star
  //   - `mouseRadius` in shouldDrawConnection() allows ALL nearby stars to connect when
  //     the pointer is inside the radius (independent of `canConnect` flag).
  // `canConnect` is the per-star eligibility flag, not the global gate.
  const canConnect = config.connectionsWhenNoMouse && Math.random() < config.percentStarsConnecting / 100;

  return {
    x,
    y,
    size: size * depth,
    shape,
    speedX,
    speedY,
    rotation: 0,
    rotationSpeed,
    depth,
    canConnect,
    originalX: x,
    originalY: y,
  };
}

function resizeCanvas(
  backgroundCanvas: HTMLCanvasElement,
  starsCanvas: HTMLCanvasElement,
  ctxBg: CanvasRenderingContext2D,
  ctxSt: CanvasRenderingContext2D,
  state: StarfieldState,
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  state.width = window.innerWidth;
  state.height = window.innerHeight;

  backgroundCanvas.width = Math.floor(state.width * dpr);
  backgroundCanvas.height = Math.floor(state.height * dpr);
  backgroundCanvas.style.width = `${state.width}px`;
  backgroundCanvas.style.height = `${state.height}px`;

  starsCanvas.width = Math.floor(state.width * dpr);
  starsCanvas.height = Math.floor(state.height * dpr);
  starsCanvas.style.width = `${state.width}px`;
  starsCanvas.style.height = `${state.height}px`;

  ctxBg.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctxSt.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground(ctxBg: CanvasRenderingContext2D, width: number, height: number): void {
  ctxBg.clearRect(0, 0, width, height);
}

function createStars(state: StarfieldState, context: StarfieldContext): void {
  state.stars.length = 0;
  state.cells = {};

  const numberOfStars = starDensities[context.config.starDensity] * state.width * state.height;

  for (let i = 0; i < numberOfStars; i++) {
    const x = Math.random() * state.width;
    const y = Math.random() * state.height;
    const star = createStar(x, y, context.config);
    state.stars.push(star);
    getOrCreateCell(state.cells, Math.floor(star.x / context.cellSize), Math.floor(star.y / context.cellSize)).push(star);
  }
}

function updateStarPositionForParallax(state: StarfieldState, config: StarfieldEffectConfig): void {
  if (!config.parallaxEffect || state.pointer.x === null || state.pointer.y === null) return;

  const dx = (state.width / 2 - state.pointer.x) / config.parallaxStrength;
  const dy = (state.height / 2 - state.pointer.y) / config.parallaxStrength;

  state.stars.forEach((star) => {
    star.x = star.originalX + dx * (1 - star.depth);
    star.y = star.originalY + dy * (1 - star.depth);
  });
}

function drawStar(star: Star, ctxSt: CanvasRenderingContext2D, config: StarfieldEffectConfig): void {
  ctxSt.beginPath();
  ctxSt.fillStyle = config.starColor;
  ctxSt.globalAlpha = config.starOpacity;

  switch (star.shape) {
    case 'circle':
      ctxSt.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      break;
    case 'star':
      drawStarShape(ctxSt, star);
      break;
  }

  ctxSt.closePath();
  ctxSt.fill();
  ctxSt.globalAlpha = 1;
}

function drawStarShape(ctxSt: CanvasRenderingContext2D, star: Star): void {
  ctxSt.save();
  ctxSt.translate(star.x, star.y);
  ctxSt.rotate(star.rotation);
  ctxSt.beginPath();

  for (let i = 0; i < STAR_POINTS; i++) {
    ctxSt.lineTo(0, -star.size / 2);
    ctxSt.translate(0, -star.size / 2);
    ctxSt.rotate((Math.PI * 2) / 10);
    ctxSt.lineTo(0, -star.size / 2);
    ctxSt.translate(0, -star.size / 2);
    ctxSt.rotate(-((Math.PI * 6) / 10));
  }

  ctxSt.lineTo(0, -star.size / 2);
  ctxSt.restore();
}

function shouldDrawConnection(
  star: Star,
  otherStar: Star,
  pointer: PointerState,
  maxDistance: number,
  mouseRadius: number,
): boolean {
  if (otherStar === star) return false;

  const distance = calculateDistance(star.x, star.y, otherStar.x, otherStar.y);
  let pointerDistance = Infinity;

  if (pointer.x !== null && pointer.y !== null) {
    pointerDistance = calculateDistance(star.x, star.y, pointer.x, pointer.y);
  }

  return distance < maxDistance && (pointerDistance < mouseRadius || (star.canConnect && otherStar.canConnect));
}

function drawConnectionLine(
  star: Star,
  otherStar: Star,
  ctxSt: CanvasRenderingContext2D,
  config: StarfieldEffectConfig,
  starRgb: { r: number; g: number; b: number },
): void {
  ctxSt.beginPath();
  ctxSt.moveTo(star.x, star.y);
  ctxSt.lineTo(otherStar.x, otherStar.y);

  const distance = calculateDistance(star.x, star.y, otherStar.x, otherStar.y);
  const opacity = calculateConnectionOpacity(distance, config.maxDistance, config.linkOpacity);
  ctxSt.strokeStyle = `rgba(${starRgb.r}, ${starRgb.g}, ${starRgb.b}, ${opacity})`;
  ctxSt.lineWidth = config.lineThickness;
  ctxSt.stroke();
}

function processNeighbourCell(
  star: Star,
  neighbourCell: Star[],
  state: StarfieldState,
  context: StarfieldContext,
): void {
  neighbourCell.forEach((otherStar) => {
    if (!shouldDrawConnection(star, otherStar, state.pointer, context.config.maxDistance, context.config.mouseRadius)) {
      return;
    }
    drawConnectionLine(star, otherStar, context.ctxSt, context.config, context.starRgb);
  });
}

function drawConnections(
  star: Star,
  state: StarfieldState,
  context: StarfieldContext,
): void {
  const cellX = Math.floor(star.x / context.cellSize);
  const cellY = Math.floor(star.y / context.cellSize);

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const neighbourCell = state.cells[String(cellX + i)]?.[String(cellY + j)];
      if (!neighbourCell) continue;
      processNeighbourCell(star, neighbourCell, state, context);
    }
  }
}

function updateStar(star: Star, width: number, height: number): void {
  star.x += star.speedX;
  star.y += star.speedY;

  if (star.shape === 'star') {
    star.rotation += star.rotationSpeed;
  }

  if (star.x > width || star.x < 0) {
    star.speedX = -star.speedX;
  }
  if (star.y > height || star.y < 0) {
    star.speedY = -star.speedY;
  }
}

function animateFrame(state: StarfieldState, context: StarfieldContext): void {
  updateStarPositionForParallax(state, context.config);
  context.ctxSt.clearRect(0, 0, state.width, state.height);

  // Rebuild the spatial cell grid every frame: parallax + per-star drift move stars
  // across cell boundaries, so a frame-1 index would miss neighbor pairs on frame 2.
  // O(n) is acceptable because cellSize === maxDistance, so each connection check
  // only scans a 3x3 window of cells.
  state.cells = {};

  state.stars.forEach((star) => {
    updateStar(star, state.width, state.height);
    drawStar(star, context.ctxSt, context.config);
    getOrCreateCell(state.cells, Math.floor(star.x / context.cellSize), Math.floor(star.y / context.cellSize)).push(star);
    drawConnections(star, state, context);
  });
}

function animateStars(state: StarfieldState, context: StarfieldContext): void {
  if (!state.isVisible) return;

  animateFrame(state, context);
  state.rafId = requestAnimationFrame(() => animateStars(state, context));
}

function setPointerPosition(
  clientX: number,
  clientY: number,
  state: StarfieldState,
): void {
  state.pointer.x = clientX;
  state.pointer.y = clientY;

  if (state.idleTimeoutId) {
    clearTimeout(state.idleTimeoutId);
  }

  state.idleTimeoutId = setTimeout(() => {
    state.pointer.x = null;
    state.pointer.y = null;
  }, IDLE_RESTART_TIME);
}

function handleVisibilityChange(state: StarfieldState, context: StarfieldContext): void {
  state.isVisible = !document.hidden;
  if (state.isVisible && !state.rafId) {
    state.rafId = requestAnimationFrame(() => animateStars(state, context));
  } else if (!state.isVisible && state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }
}

function handleResize(state: StarfieldState, context: StarfieldContext): void {
  state.stars.length = 0;
  state.cells = {};
  resizeCanvas(context.backgroundCanvas, context.starsCanvas, context.ctxBg, context.ctxSt, state);
  drawBackground(context.ctxBg, state.width, state.height);
  createStars(state, context);
}

type StarfieldEventHandlers = {
  handleTouchStart: (_event: TouchEvent) => void;
  handleTouchMove: (_event: TouchEvent) => void;
  handleMouseMove: (_event: MouseEvent) => void;
  handleVisibilityChange: () => void;
  handleResize: () => void;
};

function addEventListeners(handlers: StarfieldEventHandlers) {
  window.addEventListener('resize', handlers.handleResize);
  window.addEventListener('mousemove', handlers.handleMouseMove);
  window.addEventListener('touchstart', handlers.handleTouchStart as EventListener);
  window.addEventListener('touchmove', handlers.handleTouchMove as EventListener);
  document.addEventListener('visibilitychange', handlers.handleVisibilityChange);
}

function removeEventListeners(handlers: StarfieldEventHandlers) {
  window.removeEventListener('resize', handlers.handleResize);
  window.removeEventListener('mousemove', handlers.handleMouseMove);
  window.removeEventListener('touchstart', handlers.handleTouchStart as EventListener);
  window.removeEventListener('touchmove', handlers.handleTouchMove as EventListener);
  document.removeEventListener('visibilitychange', handlers.handleVisibilityChange);
}

/**
 * Bootstraps the starfield canvas animation.
 *
 * Lifecycle (in order):
 *   1. Resize — canvas backing store is sized to `window.innerWidth/Height` × `DPR_CAP`.
 *   2. Seed — `state.stars` is populated from `starDensities[config.starDensity]`.
 *   3. RAF + listeners — a `requestAnimationFrame` loop drives `animateStars`;
 *      `resize`/`mousemove`/`touchstart`/`touchmove`/`visibilitychange` are wired.
 *
 * The returned teardown function MUST be invoked when the host component unmounts
 * (Astro view transitions, route change, etc.). It cancels the RAF, clears the
 * idle pointer timeout, and removes every window/document listener registered
 * above. Forgetting to call it leaks listeners and keeps the animation alive
 * after the canvas is gone.
 *
 * @returns A teardown handle — call it on unmount to release resources.
 */
export function initStarfieldCore(
  backgroundCanvas: HTMLCanvasElement,
  starsCanvas: HTMLCanvasElement,
  config: StarfieldEffectConfig,
  ctxBg: CanvasRenderingContext2D,
  ctxSt: CanvasRenderingContext2D,
): () => void {
  const state: StarfieldState = {
    stars: [],
    cells: {},
    pointer: { x: null, y: null },
    rafId: 0,
    idleTimeoutId: null,
    width: 0,
    height: 0,
    isVisible: true,
  };

  const context: StarfieldContext = {
    backgroundCanvas,
    starsCanvas,
    config,
    ctxBg,
    ctxSt,
    starRgb: parseHexColorOrDefault(config.starColor),
    cellSize: config.maxDistance,
  };

  resizeCanvas(backgroundCanvas, starsCanvas, ctxBg, ctxSt, state);
  drawBackground(ctxBg, state.width, state.height);
  createStars(state, context);
  state.rafId = requestAnimationFrame(() => animateStars(state, context));

  const handlers: StarfieldEventHandlers = {
    handleTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) setPointerPosition(touch.clientX, touch.clientY, state);
    },
    handleTouchMove: (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) setPointerPosition(touch.clientX, touch.clientY, state);
    },
    handleMouseMove: (event: MouseEvent) => setPointerPosition(event.clientX, event.clientY, state),
    handleVisibilityChange: () => handleVisibilityChange(state, context),
    handleResize: () => handleResize(state, context),
  };
  addEventListeners(handlers);

  return () => {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    if (state.idleTimeoutId) {
      clearTimeout(state.idleTimeoutId);
    }
    removeEventListeners(handlers);
  };
}
