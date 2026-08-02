import Swiper from 'swiper';
import type { Swiper as SwiperInstance } from 'swiper';
import type { SwiperOptions } from 'swiper/types';
import { EffectCoverflow, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { parseNumericAttr } from '~/core/content/normalize';
import { assertPositiveInteger } from '~/core/validation/assert';

const ROOT_SELECTOR = '.home-carousel';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SWIPER_INIT_FLAG = 'swiperInitialized';

const CAROUSEL_ANIMATION_SPEED_MS = 600;
// Coverflow `depth`: how far behind the active slide adjacent slides sit on the Z axis (px).
const CAROUSEL_COVERFLOW_DEPTH = 100;
// Coverflow `modifier`: multiplier scaling the rotate/stretch/depth values for the effect intensity.
const CAROUSEL_COVERFLOW_MODIFIER = 2.5;

// Module-level state shared across every init call. The reduced-motion MediaQueryList
// and the listener-binding flag are both intentionally cached here so multiple carousels
// on the same page share one matchMedia instance and one global listener (avoiding
// O(n) listeners). Tests reset this state via resetCarouselState() to start clean.
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

function getCounterPadLength(root: HTMLElement): number {
  const raw = root.getAttribute('data-counter-pad-length');
  return assertPositiveInteger(parseNumericAttr(raw, 2), 'data-counter-pad-length');
}

function updateCounter(swiper: SwiperInstance, counterPadLength: number): void {
  const currentEl = swiper.el.querySelector<HTMLElement>('.count-current');

  if (currentEl) {
    currentEl.textContent = (swiper.realIndex + 1).toString().padStart(counterPadLength, '0');
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

/**
 * Returns all `.home-carousel` elements that are HTMLElements
 * (filtering out any non-element matches from `querySelectorAll`).
 */
function getCarouselRoots(): SwiperRoot[] {
  return Array.from(document.querySelectorAll(ROOT_SELECTOR)).filter(
    (root): root is SwiperRoot => root instanceof HTMLElement
  );
}

function getSpaceBetween(root: HTMLElement): number {
  const raw = root.getAttribute('data-space-between');
  const parsed = parseNumericAttr(raw, 0, { float: true });
  return parsed >= 0 ? parsed : 0;
}

/** Updates an existing Swiper instance when the user's motion preference changes at runtime. */
function applyMotionSettings(swiper: SwiperInstance): void {
  const useReducedMotion = prefersReducedMotion();
  swiper.params.speed = useReducedMotion ? 0 : CAROUSEL_ANIMATION_SPEED_MS;
  swiper.params.effect = useReducedMotion ? 'slide' : 'coverflow';
}

function createSwiperConfig(root: SwiperRoot): SwiperOptions {
  const prevEl = root.querySelector<HTMLElement>('.nav-arrow--prev');
  const nextEl = root.querySelector<HTMLElement>('.nav-arrow--next');
  const paginationEl = root.querySelector<HTMLElement>('.swiper-pagination');
  const useReducedMotion = prefersReducedMotion();
  const spaceBetween = getSpaceBetween(root);
  const counterPadLength = getCounterPadLength(root);

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
        updateCounter(_this, counterPadLength);
      },
      slideChange(_this: SwiperInstance) {
        hideSwipeHint(root);
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

/**
 * Initializes a single Swiper instance on the given root, guarding against
 * double-init and missing slide markup. Returns success/failure so callers
 * can choose to log or fall back.
 */
function initSwiper(root: SwiperRoot): { success: boolean; reason?: string } {
  if (root.dataset[SWIPER_INIT_FLAG] === 'true') {
    return { success: false, reason: 'already-initialized' };
  }

  const slides = root.querySelectorAll('.swiper-slide');
  if (slides.length === 0) {
    return { success: false, reason: 'no-slides' };
  }

  const swiper = new Swiper(root, createSwiperConfig(root));
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
    initSwiper(root);
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
