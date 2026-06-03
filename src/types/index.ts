// Barrel export for centralized type definitions
// Re-export all types from category files

// Site core types
export type {
  SiteConfig,
  SiteMetadata,
  SiteMetadataConfig,
  NavigationConfig,
  SiteNavigation,
  SiteMetadataInput,
  PhotographyPageConfig,
  MediaConfig,
  Publication,
  AboutPageData,
} from './site';

// Home page types
export type { HomePageConfig } from './home-config';
export type {
  HomepageSectionKey,
  HomepageHeroDeckField,
  HomepageEditorialGapVariant,
  HomePageHero,
  HomePageFeaturedMediaConfig,
  HomePageConfigGroup,
  Home,
  HomepageConfig,
  HomepageConfigSlice,
  HomePageData,
} from './home';

// Carousel types
export type {
  HomePageCarouselSlideWidth,
  HomePageCarouselVisualConfig,
  HomePageCarouselConfig,
} from './carousel';

// Image config types
export type {
  GridColumns,
  MediaGridConfig,
  SiteImageConfig,
  HomePageImageConfig,
} from './image-config';

// Effects types
export type {
  StarfieldEffectConfig,
  SiteEffectsConfig,
} from './effects';

// Profile types
export type {
  ProfileFact,
  ProfileData,
  ResolvedProfileData,
} from './profile';

// Page types
export type {
  LayoutProps,
} from './page';

// Media types
export type {
  ContentImageOptions,
  ContentImageResponsive,
  ContentImage,
  MediaImage,
  MediaAlbum,
  MediaCategory,
  MediaTree,
  FeaturedSlide,
} from './media';