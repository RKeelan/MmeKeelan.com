import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Set the base path for GitHub Pages deployment
  base: '/MmeKeelan.com/',
  // Set the root to the src directory so vite serves files from there
  root: 'src',
  // Define the entry point for the application. Vite will start processing from this HTML file.
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/index.html'),
        roulette: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/roulette.html'),
        bingo: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/bingo.html'),
        canada: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/canada.html'),
        schedule: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/schedule.html'),
        error: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/error.html')
      }
    },
    // Specify the output directory for the build. Files will be placed here after `vite build`.
    outDir: '../dist', 
  },
  // Configure the development server.
  server: {
    // configure dev server if needed
  },
  // if you had specific webpack aliases, you might want to replicate them here
  resolve: { 
    alias: {
      // example: '@': path.resolve(__dirname, './src')
    }
  }
});
