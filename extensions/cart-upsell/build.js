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
    
    // Build Cart Drawer
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
    
    // Add version banner to cart-drawer
    const cartDrawerFile = join(__dirname, 'assets/cart-drawer.js');
    const cartDrawerContent = readFileSync(cartDrawerFile, 'utf-8');
    const cartDrawerBanner = `/**\n * Upsellity Cart Drawer v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(cartDrawerFile, cartDrawerBanner + cartDrawerContent);
    console.log(`✅ Successfully built cart-drawer.js v${version}`);
    
    // Build FBT Widget
    console.log(`🔨 Building fbt-widget.js v${version}...`);
    await esbuild.build({
      entryPoints: [join(__dirname, 'assets/modules/fbt-widget-entry.js')],
      bundle: true,
      outfile: join(__dirname, 'assets/fbt-widget.js'),
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
        '__FBT_VERSION__': `"${version}"`
      },
      external: [],
    });
    
    // Add version banner to fbt-widget
    const fbtWidgetFile = join(__dirname, 'assets/fbt-widget.js');
    const fbtWidgetContent = readFileSync(fbtWidgetFile, 'utf-8');
    const fbtWidgetBanner = `/**\n * Upsellity FBT Widget v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(fbtWidgetFile, fbtWidgetBanner + fbtWidgetContent);
    console.log(`✅ Successfully built fbt-widget.js v${version}`);
    
    console.log(`\n🎉 All builds completed successfully v${version}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

