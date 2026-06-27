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
│   └── blog/*/               # Blog posts (README.md + assets)
├── src/
│   ├── components/           # Astro UI components
│   ├── layouts/              # Shared layout shell
│   ├── lib/                  # Config/content/media loaders
│   │   ├── content-paths.ts  # Centralized resource path definitions
│   │   └── loaders/          # Content loaders (blog, photos, etc.)
│   ├── pages/                # Route entry pages (index, blog, photos, about)
│   └── styles/               # Global tokens and shared styles
├── tests/
└── package.json
```

## References

- Carousel references: https://swiperjs.com/demos
- Visual effects inspiration: https://codepen.io/trending
