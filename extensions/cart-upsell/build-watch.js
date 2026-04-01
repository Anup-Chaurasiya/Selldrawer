import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read config from config.js
function getConfig() {
  try {
    const configContent = readFileSync(join(__dirname, 'config.js'), 'utf-8');
    const appUrlMatch = configContent.match(/export const APP_URL = ['"](.+)['"]/);
    
    return {
      appUrl: appUrlMatch ? appUrlMatch[1] : 'https://app.selldrawer.com'
    };
  } catch (error) {
    return {
      appUrl: 'https://app.selldrawer.com'
    };
  }
}

async function watch() {
  const config = getConfig();
  const { appUrl } = config;
  
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
      '__APP_URL__': `"${appUrl}"`
    },
    external: [],
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
      '__APP_URL__': `"${appUrl}"`
    },
    external: [],
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
      '__APP_URL__': `"${appUrl}"`
    },
    external: [],
  });



  // Start watching all contexts
  await cartDrawerContext.watch();
  await fbtWidgetContext.watch();
  await promotionalBannerContext.watch();
  
}

watch().catch((error) => {
  process.exit(1);
});

