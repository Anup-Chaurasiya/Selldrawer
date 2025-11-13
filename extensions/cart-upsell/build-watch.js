import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function watch() {
  console.log('👀 Watching cart-drawer files for changes...');
  
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
      'process.env.NODE_ENV': '"production"'
    },
    external: [],
  });

  await context.watch();
  console.log('✅ Watching for changes... Press Ctrl+C to stop.');
}

watch().catch((error) => {
  console.error('❌ Watch failed:', error);
  process.exit(1);
});

