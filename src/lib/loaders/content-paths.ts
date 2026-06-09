export const CONTENT_ROOT = '../../content';

// Content directories
export const ABOUT_DIR = `${CONTENT_ROOT}/about`;
export const BACKGROUND_DIR = `${CONTENT_ROOT}/background`;
export const PHOTOGRAPHY_DIR = `${CONTENT_ROOT}/photography`;
export const PUBLICATION_DIR = `${ABOUT_DIR}/publication`;
// NOTE: Vite's import.meta.glob requires string literals at build time — dynamic
// expressions like `${CONTENT_ROOT}/**/*.json` cannot be analyzed statically, so
// glob patterns must be hardcoded here rather than derived from CONTENT_ROOT

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

export const ABOUT_AVATAR_SIZES = [180, 220] as const;
