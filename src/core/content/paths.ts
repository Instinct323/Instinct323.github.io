const CONTENT_ROOT = '../../content';

const ABOUT_DIR = `${CONTENT_ROOT}/about`;

// Vite glob patterns remain literal in the Astro adapters; this prefix only
// normalizes the module keys returned by those globs.
export const CONTENT_MODULE_KEY_PREFIX = '../../../../content/';
export const PHOTOGRAPHY_MODULE_KEY_PREFIX = 'photography/';

export const PHOTOGRAPHY_FILTER = '/content/photography/';

export const AVATAR_JPG = `${ABOUT_DIR}/avatar.jpg`;
export const AVATAR_RELATIVE_PATH = 'about/avatar.jpg';

export const ABOUT_AVATAR_SIZES = [180, 220] as const;
