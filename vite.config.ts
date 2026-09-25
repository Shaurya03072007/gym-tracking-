import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const projectRoot = import.meta.dirname;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, '.'),
        '@mediapipe/pose': path.resolve(projectRoot, 'src/shims/mediapipe-pose-shim.ts'),
      },
    },
    optimizeDeps: {
      include: ['@tensorflow/tfjs', '@tensorflow-models/pose-detection'],
    },
    server: {
      // HMR configuration
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
