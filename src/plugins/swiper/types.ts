export interface HomePageCarouselSlideWidth {
  desktop: string;
  tablet: string;
  mobile: string;
}

export interface HomePageCarouselVisualConfig {
  spaceBetween: number;
  slideWidth: HomePageCarouselSlideWidth;
  inactiveOpacity: number;
}

export interface HomePageCarouselConfig {
  ariaLabel: string;
  prevButtonAriaLabel: string;
  nextButtonAriaLabel: string;
  emptyText: string;
  showNavigationArrows: boolean;
  showIndicator: boolean;
  counterPadLength: number;
  visual: HomePageCarouselVisualConfig;
}