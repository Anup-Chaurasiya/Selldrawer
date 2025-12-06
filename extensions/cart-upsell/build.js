import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read config from config.js
function getConfig() {
  try {
    const configContent = readFileSync(join(__dirname, 'config.js'), 'utf-8');
    const versionMatch = configContent.match(/export const VERSION = ['"](.+)['"]/);
    const appUrlMatch = configContent.match(/export const APP_URL = ['"](.+)['"]/);
    
    return {
      version: versionMatch ? versionMatch[1] : '1.0.0',
      appUrl: appUrlMatch ? appUrlMatch[1] : 'https://app.upsellity.com'
    };
  } catch (error) {
    console.warn('⚠️ Could not read config.js, using defaults');
    return {
      version: '1.0.0',
      appUrl: 'https://app.upsellity.com'
    };
  }
}

async function build() {
  try {
    const config = getConfig();
    const { version, appUrl } = config;
    
    console.log(`📦 Building with VERSION: ${version}, APP_URL: ${appUrl}`);
    
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
        '__CART_DRAWER_VERSION__': `"${version}"`,
        '__APP_URL__': `"${appUrl}"`
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
        '__FBT_VERSION__': `"${version}"`,
        '__APP_URL__': `"${appUrl}"`
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
        '__NUDGE_VERSION__': `"${version}"`,
        '__APP_URL__': `"${appUrl}"`
      },
      external: [],
    });
    
    // Add version banner to nudge-popup
    const nudgePopupFile = join(__dirname, 'assets/nudge-popup.js');
    const nudgePopupContent = readFileSync(nudgePopupFile, 'utf-8');
    const nudgePopupBanner = `/**\n * Upsellity Nudge Popup v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(nudgePopupFile, nudgePopupBanner + nudgePopupContent);
    
    
    // Build Nudge Add Together
    await esbuild.build({
      entryPoints: [join(__dirname, 'assets/modules/nudge-add-together-entry.js')],
      bundle: true,
      outfile: join(__dirname, 'assets/nudge-add-together.js'),
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
        '__NUDGE_ADD_TOGETHER_VERSION__': `"${version}"`,
        '__APP_URL__': `"${appUrl}"`
      },
      external: [],
    });
    
    // Add version banner to nudge-add-together
    const nudgeAddTogetherFile = join(__dirname, 'assets/nudge-add-together.js');
    const nudgeAddTogetherContent = readFileSync(nudgeAddTogetherFile, 'utf-8');
    const nudgeAddTogetherBanner = `/**\n * Upsellity Nudge Add Together v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(nudgeAddTogetherFile, nudgeAddTogetherBanner + nudgeAddTogetherContent);
    
    
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
        '__PROMOTIONAL_BANNER_VERSION__': `"${version}"`,
        '__APP_URL__': `"${appUrl}"`
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

