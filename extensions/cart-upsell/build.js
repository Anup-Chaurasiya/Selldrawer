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

async function build() {
  try {
    const version = getVersion();
    console.log(`🔨 Building cart-drawer.js v${version}...`);
    
    await esbuild.build({
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
    });
    
    // Add version banner to the built file
    const outfile = join(__dirname, 'assets/cart-drawer.js');
    const content = readFileSync(outfile, 'utf-8');
    const banner = `/**\n * Upsellity Cart Drawer v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(outfile, banner + content);
    
    console.log(`✅ Successfully built cart-drawer.js v${version}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

