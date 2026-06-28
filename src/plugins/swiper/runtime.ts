import Swiper from 'swiper';
import type { Swiper as SwiperInstance } from 'swiper';
import type { SwiperOptions } from 'swiper/types';
import { EffectCoverflow, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { parseNumericAttr } from '~/core/content/normalize';

const ROOT_SELECTOR = '.home-carousel';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SWIPER_INIT_FLAG = 'swiperInitialized';

const CAROUSEL_ANIMATION_SPEED_MS = 600;
const CAROUSEL_COVERFLOW_DEPTH = 100;
const CAROUSEL_COVERFLOW_MODIFIER = 2.5;

// Module-level state: intentional cross-call cache. Reset via resetCarouselState().
const state = {
  reducedMotionQuery: null as MediaQueryList | null,
  reducedMotionListenerBound: false,
};

/** @internal */
export function resetCarouselState(): void {
  state.reducedMotionQuery = null;
  state.reducedMotionListenerBound = false;
}

interface SwiperRoot extends HTMLElement {
  swiperApi?: SwiperInstance;
}

export interface CarouselConfig {
  spaceBetween: number;
  counterPadLength: number;
}

/** Lazily creates and caches the reduced-motion media query so every carousel shares one instance. */
function getReducedMotionQuery(): MediaQueryList {
  if (!state.reducedMotionQuery) {
    state.reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  }

  return state.reducedMotionQuery;
}

/** Checks whether the user has requested reduced motion via OS accessibility settings. */
function prefersReducedMotion(): boolean {
  return getReducedMotionQuery().matches;
}

function hideSwipeHint(root: HTMLElement): void {
  if (root.querySelector('.swiper-swipe-hint')) {
    root.classList.add('swiper--interacted');
  }
}

function updateProgress(swiper: SwiperInstance, slideCount: number): void {
  const progressBar = swiper.el.querySelector<HTMLElement>('.swiper-progress-bar');

  if (!progressBar) {
    return;
  }

  const progress = ((swiper.activeIndex + 1) / slideCount) * 100;
  progressBar.style.width = `${progress}%`;
}

function getCounterPadLength(root: HTMLElement, configPadLength?: number): number {
  if (configPadLength !== undefined) {
    return configPadLength > 0 ? configPadLength : 2;
  }
  const raw = root.getAttribute('data-counter-pad-length');
  const parsed = parseNumericAttr(raw, 2);
  return parsed > 0 ? parsed : 2;
}

function updateCounter(swiper: SwiperInstance, counterPadLength?: number): void {
  const currentEl = swiper.el.querySelector<HTMLElement>('.count-current') ||
    swiper.el.querySelector<HTMLElement>('.swiper-counter-current');

  if (currentEl) {
    const padLength = getCounterPadLength(swiper.el, counterPadLength);
    currentEl.textContent = (swiper.realIndex + 1).toString().padStart(padLength, '0');
  }

  const progressFill = swiper.el.querySelector<HTMLElement>('.indicator-progress-fill');
  if (progressFill) {
    const progress = ((swiper.realIndex + 1) / swiper.slides.length) * 100;
    progressFill.style.width = `${progress}%`;
  }
}

function updatePaginationAria(swiper: SwiperInstance): void {
  const bullets = swiper.el.querySelectorAll<HTMLElement>('.swiper-pagination-bullet');

  bullets.forEach((bullet, index) => {
    const isActive = index === swiper.activeIndex;
    bullet.setAttribute('aria-selected', isActive ? 'true' : 'false');
    bullet.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

/** Finds all carousel root elements in the DOM that are ready for Swiper initialization. */
function getCarouselRoots(): SwiperRoot[] {
  return Array.from(document.querySelectorAll(ROOT_SELECTOR)).filter(
    (root): root is SwiperRoot => root instanceof HTMLElement
  );
}

function getSlideCount(root: HTMLElement): number {
  const totalEl = root.querySelector('.swiper-counter-total');
  const parsed = Number.parseInt(totalEl?.textContent ?? '1', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getSpaceBetween(root: HTMLElement): number {
  const raw = root.getAttribute('data-space-between');
  const parsed = parseNumericAttr(raw, 0, { float: true });
  return parsed >= 0 ? parsed : 0;
}

/** Tries each selector in order and returns the first matching HTMLElement, or null if none match. Supports graceful degradation when markup uses legacy or current class names. */
function getFirstOptionalHTMLElement(root: ParentNode, selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    if (el instanceof HTMLElement) {
      return el;
    }
  }

  return null;
}

/** Updates an existing Swiper instance when the user's motion preference changes at runtime. */
function applyMotionSettings(swiper: SwiperInstance): void {
  const useReducedMotion = prefersReducedMotion();
  swiper.params.speed = useReducedMotion ? 0 : CAROUSEL_ANIMATION_SPEED_MS;
  swiper.params.effect = useReducedMotion ? 'slide' : 'coverflow';
}

function createSwiperConfig(root: SwiperRoot, slideCount: number, config?: Partial<CarouselConfig>): SwiperOptions {
  const prevEl = getFirstOptionalHTMLElement(root, ['.nav-arrow--prev', '.swiper-nav-btn--prev']);
  const nextEl = getFirstOptionalHTMLElement(root, ['.nav-arrow--next', '.swiper-nav-btn--next']);
  const paginationEl = getFirstOptionalHTMLElement(root, ['.swiper-pagination']);
  const useReducedMotion = prefersReducedMotion();
  const spaceBetween = config?.spaceBetween ?? getSpaceBetween(root);
  const counterPadLength = config?.counterPadLength ?? getCounterPadLength(root);

  return {
    modules: [Navigation, Pagination, EffectCoverflow, Keyboard],
    effect: useReducedMotion ? 'slide' : 'coverflow',
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: CAROUSEL_COVERFLOW_DEPTH,
      modifier: CAROUSEL_COVERFLOW_MODIFIER,
      slideShadows: true,
    },
    centeredSlides: true,
    slidesPerView: 'auto',
    spaceBetween,
    loop: true,
    speed: useReducedMotion ? 0 : CAROUSEL_ANIMATION_SPEED_MS,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    navigation: {
      prevEl,
      nextEl,
    },
    pagination: {
      el: paginationEl,
      clickable: true,
      renderBullet(index: number, className: string): string {
        return `<button type="button" class="${className}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-label="Go to slide ${index + 1}" tabindex="${index === 0 ? '0' : '-1'}"></button>`;
      },
    },
    on: {
      init(_this: SwiperInstance) {
        root.dataset[SWIPER_INIT_FLAG] = 'true';
        root.classList.add('swiper--initialized');
        updateProgress(_this, slideCount);
        updateCounter(_this, counterPadLength);
      },
      slideChange(_this: SwiperInstance) {
        hideSwipeHint(root);
        updateProgress(_this, slideCount);
        updateCounter(_this, counterPadLength);
        updatePaginationAria(_this);
      },
      click() {
        hideSwipeHint(root);
      },
      touchStart() {
        hideSwipeHint(root);
      },
    },
  };
}

function initSwiper(
  root: SwiperRoot,
  slideCount: number,
  config?: Partial<CarouselConfig>,
): { success: boolean; reason?: string } {
  if (root.dataset[SWIPER_INIT_FLAG] === 'true') {
    return { success: false, reason: 'already-initialized' };
  }

  const slides = root.querySelectorAll('.swiper-slide');
  if (slides.length === 0) {
    return { success: false, reason: 'no-slides' };
  }

  const swiper = new Swiper(root, createSwiperConfig(root, slideCount, config));
  root.swiperApi = swiper;
  return { success: true };
}

/**
 * Scans the DOM for carousel roots and initializes Swiper instances with coverflow effect.
 * Swiper needs the DOM to be ready so it can measure slide dimensions correctly.
 */
export function initFeaturedMediaCarousels(): void {
  const roots = getCarouselRoots();

  roots.forEach((root) => {
    const runtimeConfig: Partial<CarouselConfig> = {
      spaceBetween: getSpaceBetween(root),
      counterPadLength: getCounterPadLength(root),
    };
    initSwiper(root, getSlideCount(root), runtimeConfig);
  });
}

/**
 * Registers a single global media-query listener that updates all existing carousel
 * instances when the user's motion preference changes. One listener avoids O(n)
 * listeners and ensures every carousel reacts consistently to accessibility settings.
 */
export function registerFeaturedMediaCarouselReducedMotion(): void {
  if (state.reducedMotionListenerBound) {
    return;
  }

  state.reducedMotionListenerBound = true;
  getReducedMotionQuery().addEventListener('change', () => {
    getCarouselRoots().forEach((root) => {
      if (root.swiperApi) {
        applyMotionSettings(root.swiperApi);
      }
    });
  });
}
