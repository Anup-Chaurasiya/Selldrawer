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
    
    
    // Build FBT Widget
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
    
    
    // Build Nudge Popup
    await esbuild.build({
      entryPoints: [join(__dirname, 'assets/modules/nudge-popup-entry.js')],
      bundle: true,
      outfile: join(__dirname, 'assets/nudge-popup.js'),
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
        '__NUDGE_VERSION__': `"${version}"`
      },
      external: [],
    });
    
    // Add version banner to nudge-popup
    const nudgePopupFile = join(__dirname, 'assets/nudge-popup.js');
    const nudgePopupContent = readFileSync(nudgePopupFile, 'utf-8');
    const nudgePopupBanner = `/**\n * Upsellity Nudge Popup v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(nudgePopupFile, nudgePopupBanner + nudgePopupContent);
    
    
    // Build Promotional Banner Block
    await esbuild.build({
      entryPoints: [join(__dirname, 'assets/modules/promotional-banner-entry.js')],
      bundle: true,
      outfile: join(__dirname, 'assets/promotional-banner.js'),
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
        '.js': 'jsx',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        '__PROMOTIONAL_BANNER_VERSION__': `"${version}"`
      },
      external: [],
    });
    
    // Add version banner to promotional-banner
    const promotionalBannerFile = join(__dirname, 'assets/promotional-banner.js');
    const promotionalBannerContent = readFileSync(promotionalBannerFile, 'utf-8');
    const promotionalBannerBanner = `/**\n * Upsellity Promotional Banner Block v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(promotionalBannerFile, promotionalBannerBanner + promotionalBannerContent);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

