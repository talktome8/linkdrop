import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function inlineCss() {
  return {
    name: 'inline-css',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find(
        (item) => item.type === 'asset' && item.fileName === 'index.html',
      )

      if (!html) return

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== 'asset' || !fileName.endsWith('.css')) continue

        const stylesheet = new RegExp(
          `<link rel="stylesheet" crossorigin href="/${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`,
        )
        html.source = String(html.source).replace(stylesheet, `<style>${item.source}</style>`)
        delete bundle[fileName]
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  server: {
    port: 5000,
  },
})
