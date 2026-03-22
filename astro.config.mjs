import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://eduardomoraesritter.github.io',
  vite: {
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://qwen-chat-478866638874.us-central1.run.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
        },
      },
    },
  },
});
