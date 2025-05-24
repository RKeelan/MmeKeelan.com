import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.js';
import { mergeConfig } from 'vite';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));
