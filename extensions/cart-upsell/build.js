import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  try {
    console.log('🔨 Building cart-drawer.js...');
    
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
    });
    
    console.log('✅ Successfully built cart-drawer.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

