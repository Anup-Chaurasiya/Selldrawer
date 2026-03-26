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
      appUrl: appUrlMatch ? appUrlMatch[1] : 'https://app.selldrawer.com'
    };
  } catch (error) {
    return {
      version: '1.0.0',
      appUrl: 'https://app.selldrawer.com'
    };
  }
}

async function build() {
  try {
    const config = getConfig();
    const { version, appUrl } = config;

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
    const cartDrawerBanner = `/**\n * Selldrawer Cart Drawer v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
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
    const fbtWidgetBanner = `/**\n * Selldrawer FBT Widget v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(fbtWidgetFile, fbtWidgetBanner + fbtWidgetContent);





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
    const promotionalBannerBanner = `/**\n * Selldrawer Promotional Banner Block v${version}\n * Built: ${new Date().toISOString()}\n */\n`;
    writeFileSync(promotionalBannerFile, promotionalBannerBanner + promotionalBannerContent);




  } catch (error) {
    process.exit(1);
  }
}

build();

