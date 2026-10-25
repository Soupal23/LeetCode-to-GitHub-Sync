import fs from 'fs';
import path from 'path';
import { build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';

async function buildAll() {
  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  console.log('🚀 1/4 Building Popup UI...');
  await viteBuild({
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve('popup.html'),
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  });

  console.log('⚙️ 2/4 Building Background Service Worker...');
  await viteBuild({
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  console.log('📄 3/4 Building Content Script...');
  await viteBuild({
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/index.ts'),
        formats: ['iife'],
        name: 'LeetCodeContentScript',
        fileName: () => 'content.js',
      },
    },
  });

  console.log('💉 4/4 Building MAIN World Interceptor...');
  await viteBuild({
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/interceptor.ts'),
        formats: ['iife'],
        name: 'LeetCodeInterceptor',
        fileName: () => 'interceptor.js',
      },
    },
  });

  // Ensure manifest.json and icons are copied
  const manifestSrc = path.resolve('public/manifest.json');
  const manifestDest = path.resolve('dist/manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
  }

  const iconsSrc = path.resolve('public/icons');
  const iconsDest = path.resolve('dist/icons');
  if (fs.existsSync(iconsSrc)) {
    if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest, { recursive: true });
    fs.cpSync(iconsSrc, iconsDest, { recursive: true });
  }

  console.log('✨ Build complete! Chrome extension is ready in the dist/ folder.');
}

buildAll().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
