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

// Create version banner plugin for a specific file
function createVersionBannerPlugin(outfile, moduleName) {
  return {
    name: 'version-banner',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length === 0) {
          const config = getConfig();
          try {
            const content = readFileSync(outfile, 'utf-8');
            // Only add banner if it's not already there
            if (!content.startsWith(`/**\n * Upsellity ${moduleName}`)) {
              const banner = `/**\n * Upsellity ${moduleName} v${config.version}\n * Built: ${new Date().toISOString()}\n */\n`;
              writeFileSync(outfile, banner + content);
            }
          } catch (error) {
            console.error(`Error adding version banner for ${moduleName}:`, error);
          }
        }
      });
    },
  };
}

async function watch() {
  const config = getConfig();
  const { version, appUrl } = config;
  
  console.log(`👀 Watching with VERSION: ${version}, APP_URL: ${appUrl}`);
  
  // Watch Cart Drawer
  const cartDrawerContext = await esbuild.context({
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
    plugins: [createVersionBannerPlugin(join(__dirname, 'assets/cart-drawer.js'), 'Cart Drawer')],
  });

  // Watch FBT Widget
  const fbtWidgetContext = await esbuild.context({
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
    plugins: [createVersionBannerPlugin(join(__dirname, 'assets/fbt-widget.js'), 'FBT Widget')],
  });

  // Watch Nudge Popup
  const nudgePopupContext = await esbuild.context({
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
    plugins: [createVersionBannerPlugin(join(__dirname, 'assets/nudge-popup.js'), 'Nudge Popup')],
  });

  // Watch Promotional Banner Block
  const promotionalBannerContext = await esbuild.context({
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
    plugins: [createVersionBannerPlugin(join(__dirname, 'assets/promotional-banner.js'), 'Promotional Banner Block')],
  });

  // Start watching all contexts
  await cartDrawerContext.watch();
  await fbtWidgetContext.watch();
  await nudgePopupContext.watch();
  await promotionalBannerContext.watch();
  
}

watch().catch((error) => {
  console.error('❌ Watch failed:', error);
  process.exit(1);
});

