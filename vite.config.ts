import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from /<repo>/, so the base path is
// injected at build time. It defaults to root, which keeps `npm run dev` and
// any root-domain host (custom domain, Netlify, Vercel) working unchanged.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
});
