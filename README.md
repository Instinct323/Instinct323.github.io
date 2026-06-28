# Instinct323.github.io

Personal site built with Astro and published to GitHub Pages.

## Quick Start

```bash
bun install
bun dev
```

## Project Layout

```text
├── content/                  # Site content and config files
│   ├── about/
│   ├── background/
│   ├── blog/*/               # Blog posts (README.md + assets)
│   ├── config.jsonc
│   └── photography/
├── src/
│   ├── core/                 # Content loading, media processing, runtime, utils
│   │   ├── content/
│   │   ├── media/
│   │   ├── runtime/
│   │   ├── utils/
│   │   └── validation/
│   ├── features/             # Feature modules (about, blog, home, photography, site)
│   │   ├── about/
│   │   ├── blog/
│   │   ├── common/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── photography/
│   │   └── site/
│   ├── pages/                # Astro route entry pages
│   ├── plugins/              # Third-party plugin wrappers (starfield, swiper)
│   ├── styles/               # Global CSS tokens and shared styles
│   └── types/                # Shared type declarations
├── tests/                    # Test suites mirroring src/ structure
│   ├── core/
│   ├── features/
│   ├── mocks/
│   ├── plugins/
│   ├── assert-site-output.js
│   ├── verify-no-media-json-refs.js
│   └── verify-no-unused-tokens.js
├── scripts/
└── package.json
```

## References

- Carousel references: https://swiperjs.com/demos
- Visual effects inspiration: https://codepen.io/trending
