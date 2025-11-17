import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from version.js
function getVersion() {
  try {
    const versionContent = readFileSync(join(__dirname, 'version.js'), 'utf-8');
    const match = versionContent.match(/export const VERSION = ['"](.+)['"]/);
    return match ? match[1] : '1.0.0';
  } catch (error) {
    console.warn('⚠️ Could not read version.js, using default version 1.0.0');
    return '1.0.0';
  }
}

// Plugin to add version banner after each build
const versionBannerPlugin = {
  name: 'version-banner',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length === 0) {
        const version = getVersion();
        const outfile = join(__dirname, 'assets/cart-drawer.js');
        try {
          const content = readFileSync(outfile, 'utf-8');
          // Only add banner if it's not already there
          if (!content.startsWith('/**\n * Upsellity Cart Drawer')) {
            const banner = `/**\n * Upsellity Cart Drawer v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
            writeFileSync(outfile, banner + content);
          }
        } catch (error) {
          console.error('Error adding version banner:', error);
        }
      }
    });
  },
};

async function watch() {
  const version = getVersion();
  console.log(`👀 Watching cart-drawer files for changes... (v${version})`);
  
  const context = await esbuild.context({
    entryPoints: [join(__dirname, 'assets/modules/cart-drawer-entry.js')],
    bundle: true,
    outfile: join(__dirname, 'assets/cart-drawer.js'),
    format: 'iife',
    target: 'es2017',
    minify: false,
    sourcemap: false,
    platform: 'browser',
    logLevel: 'info',
    jsx: 'automatic',
    jsxImportSource: 'react',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      '__CART_DRAWER_VERSION__': `"${version}"`
    },
    external: [],
    plugins: [versionBannerPlugin],
  });

  await context.watch();
  console.log('✅ Watching for changes... Press Ctrl+C to stop.');
}

watch().catch((error) => {
  console.error('❌ Watch failed:', error);
  process.exit(1);
});

