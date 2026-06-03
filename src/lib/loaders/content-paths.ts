export const CONTENT_ROOT = '../../content';

// Content directories
export const ABOUT_DIR = `${CONTENT_ROOT}/about`;
export const BACKGROUND_DIR = `${CONTENT_ROOT}/background`;
export const PHOTOGRAPHY_DIR = `${CONTENT_ROOT}/photography`;
export const PUBLICATION_DIR = `${ABOUT_DIR}/publication`;
// NOTE: Hardcoded in astro-adapter.ts because Vite import.meta.glob requires string literals
// CONTENT_IMAGES_GLOB: '../../../content/**/*.{jpg,jpeg,png,webp}'
// PUBLICATION_GLOB: '../../../content/about/publication/*.json'

export const CONTENT_IMAGE_PATH_PREFIX = '../../../content/';

// Config files
export const CONFIG_FILE = `${CONTENT_ROOT}/config.jsonc`;

export const INTRODUCTION_MD_RAW = `${ABOUT_DIR}/introduction.md?raw`;
export const SITE_JSONC_RAW = `${CONFIG_FILE}?raw`;

// Filter strings
export const PHOTOGRAPHY_FILTER = '/content/photography/';

// Specific files
export const PROFILE_JSON = `${ABOUT_DIR}/profile.json`;
export const AVATAR_JPG = `${ABOUT_DIR}/avatar.jpg`;
export const DESKTOP_BG_JPG = `${BACKGROUND_DIR}/desktop.jpg`;
export const MOBILE_BG_JPG = `${BACKGROUND_DIR}/mobile.jpg`;

export {
  introductionRaw,
  profile,
  siteConfigRaw,
  backgroundDesktopSource,
  backgroundMobileSource,
} from './astro-adapter';

export const ABOUT_AVATAR_SIZES = [180, 220] as const;
