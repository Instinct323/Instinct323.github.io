import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  initFeaturedMediaCarousels,
  registerFeaturedMediaCarouselReducedMotion,
  resetCarouselState,
} from '../../../src/plugins/swiper/runtime';

interface MockSwiperInstance {
  el: HTMLElement;
  params: Record<string, unknown>;
  activeIndex: number;
  realIndex: number;
  slides: Element[];
}

const createdInstances: MockSwiperInstance[] = [];

vi.mock('swiper', () => {
  return {
    default: class MockSwiper {
      el: HTMLElement;
      params: Record<string, unknown>;
      activeIndex = 0;
      realIndex = 0;
      slides: Element[] = [];

      constructor(el: HTMLElement, params: Record<string, unknown>) {
        this.el = el;
        this.params = params;
        this.slides = Array.from(el.querySelectorAll('.swiper-slide'));
        const instance: MockSwiperInstance = {
          el,
          params,
          activeIndex: 0,
          realIndex: 0,
          slides: this.slides,
        };
        createdInstances.push(instance);
        if (typeof params.on === 'object' && params.on !== null && 'init' in params.on) {
          const on = params.on as Record<string, (_swiper: MockSwiperInstance) => void>;
          on.init(instance);
        }
      }
    },
  };
});

vi.mock('swiper/modules', () => ({
  EffectCoverflow: 'EffectCoverflow',
  Keyboard: 'Keyboard',
  Navigation: 'Navigation',
  Pagination: 'Pagination',
}));

function createCarouselRoot(options: {
  slideCount?: number;
  spaceBetween?: string;
  counterPadLength?: string;
  hasSlides?: boolean;
  alreadyInitialized?: boolean;
  hasNavArrows?: boolean;
  hasPagination?: boolean;
} = {}): HTMLElement {
  const root = document.createElement('div');
  root.className = 'home-carousel';

  if (options.alreadyInitialized) {
    root.dataset.swiperInitialized = 'true';
  }

  if (options.spaceBetween !== undefined) {
    root.setAttribute('data-space-between', options.spaceBetween);
  }

  if (options.counterPadLength !== undefined) {
    root.setAttribute('data-counter-pad-length', options.counterPadLength);
  }

  if (options.hasSlides !== false) {
    const slideCount = options.slideCount ?? 3;
    for (let i = 0; i < slideCount; i++) {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      root.appendChild(slide);
    }
  }

  const totalEl = document.createElement('span');
  totalEl.className = 'swiper-counter-total';
  totalEl.textContent = String(options.slideCount ?? 3);
  root.appendChild(totalEl);

  if (options.hasNavArrows !== false) {
    const prevEl = document.createElement('button');
    prevEl.className = 'nav-arrow--prev';
    root.appendChild(prevEl);

    const nextEl = document.createElement('button');
    nextEl.className = 'nav-arrow--next';
    root.appendChild(nextEl);
  }

  if (options.hasPagination !== false) {
    const paginationEl = document.createElement('div');
    paginationEl.className = 'swiper-pagination';
    root.appendChild(paginationEl);
  }

  document.body.appendChild(root);
  return root;
}

describe('carousel runtime', () => {
  let matchMediaMatches: boolean;
  let mockMql: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetCarouselState();
    document.body.innerHTML = '';
    createdInstances.length = 0;
    matchMediaMatches = false;

    mockMql = {
      get matches() {
        return matchMediaMatches;
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as {
      matches: boolean;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
    };

    mockMatchMedia = vi.fn(() => mockMql);
    (window as unknown as Record<string, unknown>).matchMedia = mockMatchMedia;

    vi.clearAllMocks();
  });

  describe('initFeaturedMediaCarousels', () => {
    it('initializes Swiper when slides exist', () => {
      createCarouselRoot({ slideCount: 5 });

      initFeaturedMediaCarousels();

      expect(createdInstances.length).toBe(1);
      const instance = createdInstances[0];
      expect(instance.slides.length).toBe(5);
      expect(instance.el.dataset.swiperInitialized).toBe('true');
      expect(instance.el.classList.contains('swiper--initialized')).toBe(true);
    });

    it('skips initialization when no slides are present', () => {
      createCarouselRoot({ hasSlides: false, slideCount: 0 });

      initFeaturedMediaCarousels();

      expect(createdInstances.length).toBe(0);
    });

    it('skips already-initialized carousels', () => {
      createCarouselRoot({ alreadyInitialized: true });

      initFeaturedMediaCarousels();

      expect(createdInstances.length).toBe(0);
    });

    it('initializes multiple carousels independently', () => {
      createCarouselRoot({ slideCount: 3 });
      createCarouselRoot({ slideCount: 5 });

      initFeaturedMediaCarousels();

      expect(createdInstances.length).toBe(2);
      expect(createdInstances[0].slides.length).toBe(3);
      expect(createdInstances[1].slides.length).toBe(5);
    });

    it('passes correct spaceBetween from data attribute', () => {
      createCarouselRoot({ spaceBetween: '32' });

      initFeaturedMediaCarousels();

      expect(createdInstances[0].params.spaceBetween).toBe(32);
    });

    it('falls back to 0 for invalid spaceBetween attribute', () => {
      createCarouselRoot({ spaceBetween: 'invalid' });

      initFeaturedMediaCarousels();

      expect(createdInstances[0].params.spaceBetween).toBe(0);
    });

    it('falls back to 0 for negative spaceBetween attribute', () => {
      createCarouselRoot({ spaceBetween: '-10' });

      initFeaturedMediaCarousels();

      expect(createdInstances[0].params.spaceBetween).toBe(0);
    });

    it('passes correct counterPadLength from data attribute', () => {
      const root = createCarouselRoot({ counterPadLength: '3' });
      const currentEl = document.createElement('span');
      currentEl.className = 'swiper-counter-current';
      root.appendChild(currentEl);

      initFeaturedMediaCarousels();

      expect(currentEl.textContent).toBe('001');
    });

    it('falls back to pad length of 2 for invalid counterPadLength attribute', () => {
      const root = createCarouselRoot({ counterPadLength: 'invalid' });
      const currentEl = document.createElement('span');
      currentEl.className = 'swiper-counter-current';
      root.appendChild(currentEl);

      initFeaturedMediaCarousels();

      expect(currentEl.textContent).toBe('01');
    });

    it('falls back to pad length of 2 when counterPadLength attribute is missing', () => {
      const root = createCarouselRoot();
      const currentEl = document.createElement('span');
      currentEl.className = 'swiper-counter-current';
      root.appendChild(currentEl);

      initFeaturedMediaCarousels();

      expect(currentEl.textContent).toBe('01');
    });

    it('updates progress bar on init', () => {
      const root = createCarouselRoot({ slideCount: 4 });
      const progressBar = document.createElement('div');
      progressBar.className = 'swiper-progress-bar';
      root.appendChild(progressBar);

      initFeaturedMediaCarousels();

      expect(progressBar.style.width).toBe('25%');
    });

    it('falls back to slide count of 1 for invalid counter total', () => {
      const root = createCarouselRoot({ slideCount: 3 });
      const totalEl = root.querySelector('.swiper-counter-total')!;
      totalEl.textContent = 'invalid';
      const progressBar = document.createElement('div');
      progressBar.className = 'swiper-progress-bar';
      root.appendChild(progressBar);

      initFeaturedMediaCarousels();

      expect(progressBar.style.width).toBe('100%');
    });

    it('falls back to slide count of 1 for zero counter total', () => {
      const root = createCarouselRoot({ slideCount: 3 });
      const totalEl = root.querySelector('.swiper-counter-total')!;
      totalEl.textContent = '0';
      const progressBar = document.createElement('div');
      progressBar.className = 'swiper-progress-bar';
      root.appendChild(progressBar);

      initFeaturedMediaCarousels();

      expect(progressBar.style.width).toBe('100%');
    });

    it('falls back to slide count of 1 for negative counter total', () => {
      const root = createCarouselRoot({ slideCount: 3 });
      const totalEl = root.querySelector('.swiper-counter-total')!;
      totalEl.textContent = '-3';
      const progressBar = document.createElement('div');
      progressBar.className = 'swiper-progress-bar';
      root.appendChild(progressBar);

      initFeaturedMediaCarousels();

      expect(progressBar.style.width).toBe('100%');
    });

    it('falls back to slide count of 1 when counter total element is missing', () => {
      const root = createCarouselRoot({ slideCount: 3 });
      const totalEl = root.querySelector('.swiper-counter-total')!;
      totalEl.remove();
      const progressBar = document.createElement('div');
      progressBar.className = 'swiper-progress-bar';
      root.appendChild(progressBar);

      initFeaturedMediaCarousels();

      expect(progressBar.style.width).toBe('100%');
    });
  });

  describe('registerFeaturedMediaCarouselReducedMotion', () => {
    it('adds a change listener to matchMedia', () => {
      registerFeaturedMediaCarouselReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('only binds the listener once', () => {
      registerFeaturedMediaCarouselReducedMotion();
      registerFeaturedMediaCarouselReducedMotion();

      expect(mockMql.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('updates existing carousel instances when motion preference changes', () => {
      matchMediaMatches = false;
      createCarouselRoot();
      initFeaturedMediaCarousels();

      const instance = createdInstances[0];
      expect(instance.params.speed).toBe(600);
      expect(instance.params.effect).toBe('coverflow');

      registerFeaturedMediaCarouselReducedMotion();
      const changeHandler = mockMql.addEventListener.mock.calls.find(
        (call) => call[0] === 'change'
      )?.[1] as () => void;

      matchMediaMatches = true;
      changeHandler();

      expect(instance.params.speed).toBe(0);
      expect(instance.params.effect).toBe('slide');
    });
  });

  describe('reduced motion settings', () => {
    it('applies reduced motion when prefers-reduced-motion is true', () => {
      matchMediaMatches = true;
      createCarouselRoot();

      initFeaturedMediaCarousels();

      const instance = createdInstances[0];
      expect(instance.params.speed).toBe(0);
      expect(instance.params.effect).toBe('slide');
    });

    it('applies normal motion when prefers-reduced-motion is false', () => {
      matchMediaMatches = false;
      createCarouselRoot();

      initFeaturedMediaCarousels();

      const instance = createdInstances[0];
      expect(instance.params.speed).toBe(600);
      expect(instance.params.effect).toBe('coverflow');
    });
  });
});
