import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit(),
		// Only enable PWA in production to avoid caching issues during development
		...(mode === 'production' ? [
			SvelteKitPWA({
				registerType: 'autoUpdate',
				manifest: {
					name: 'Blue Balls',
					short_name: 'BlueBalls',
					description: 'Play Blue Balls - A challenging game inspired by Flappy Bird',
					theme_color: '#4ec0ca',
					background_color: '#1a1a1a',
					display: 'standalone',
					icons: [
						{
							src: '/icon-192.png',
							sizes: '192x192',
							type: 'image/png'
						},
						{
							src: '/icon-512.png',
							sizes: '512x512',
							type: 'image/png'
						}
					]
				},
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
					// Don't cache API calls
					navigateFallback: null,
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
							handler: 'NetworkFirst',
							options: {
								cacheName: 'supabase-cache',
								networkTimeoutSeconds: 10,
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 5 * 60 // 5 minutes
								}
							}
						}
					]
				},
				devOptions: {
					enabled: false // Explicitly disable in dev
				}
			})
		] : [])
	]
}));
