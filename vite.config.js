import { defineConfig } from 'vite';

export default defineConfig({
  // Set the project root directory. This is where vite will look for package.json, .env files, etc.
  root: process.cwd(), // process.cwd() is the default, so this is explicit.
  // Define the entry point for the application. Vite will start processing from this HTML file.
  build: {
    rollupOptions: {
      input: '/src/index.html' // Path to your main HTML file, relative to the project root.
    },
    // Specify the output directory for the build. Files will be placed here after `vite build`.
    outDir: './dist', 
  },
  // Configure the development server.
  server: {
    // If your index.html is not at the root, or you want to serve from a specific path:
    // open: '/src/index.html', // Automatically open this URL in the browser on server start.
    // configure dev server if needed
  },
  // if you had specific webpack aliases, you might want to replicate them here
  resolve: { 
    alias: {
      // example: '@': path.resolve(__dirname, './src')
    }
  }
});
