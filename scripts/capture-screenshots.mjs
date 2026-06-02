import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:4321';
const OUTPUT_DIR = '/mnt/d/Workbench/Lab/opencode/screenshots';
const DIST_DIR = join(__dirname, '..', 'dist');

const ROUTES = [
  { path: '/', filename: 'home.png' },
  { path: '/about/', filename: 'about.png' },
  { path: '/photography/', filename: 'photography.png' },
  { path: '/blog/', filename: 'blog.png' },
];

const VIEWPORT = { width: 1920, height: 1080 };

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = async () => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          resolve();
          return;
        }
      } catch {}
      if (Date.now() - start > timeout) {
        reject(new Error('Server timeout'));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('bun', ['run', 'preview', '--port', '4321'], {
      cwd: join(__dirname, '..'),
      stdio: 'pipe',
    });

    let isResolved = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      // Server output suppressed to avoid lint warnings
      if (!isResolved && output.includes('astro') && output.includes('ready')) {
        isResolved = true;
        setTimeout(() => resolve(server), 500);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    server.on('error', (err) => {
      if (!isResolved) reject(err);
    });

    setTimeout(() => {
      if (!isResolved) reject(new Error('Server start timeout'));
    }, 30000);
  });
}

async function captureScreenshots() {
  if (!existsSync(DIST_DIR)) {
    console.error('dist/ not found. Run bun run build first.');
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  // Starting preview server...

  const server = await startPreviewServer();
  // Server ready, launching browser...

  let browser;
  try {
    await waitForServer(BASE_URL);

    browser = await chromium.launch();

    const context = await browser.newContext({
      viewport: VIEWPORT,
    });

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      const outputPath = join(OUTPUT_DIR, route.filename);

      // Capturing screenshot...
      const page = await context.newPage();
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Inject Google Fonts with Noto Sans SC for Chinese support
      await page.addStyleTag({
        content: `
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
          * {
            font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif !important;
          }
        `
      });
      
      // Wait for Google Fonts to load
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: outputPath,
        fullPage: false,
      });
      
      await page.close();
      // Screenshot saved
    }

    // All screenshots captured successfully
  } finally {
    if (browser) await browser.close();
    server.kill();
    // Server stopped
  }
}

captureScreenshots()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
