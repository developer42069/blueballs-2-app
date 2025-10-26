// Use Node adapter for Docker deployment
import adapter from '@sveltejs/adapter-node';
// Cloudflare adapter - commented out for Docker deployment
// import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Node adapter for Docker
		adapter: adapter({
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),
		// Cloudflare adapter (for Cloudflare Pages deployment)
		// adapter: adapterCloudflare({
		// 	routes: {
		// 		include: ['/*'],
		// 		exclude: ['<all>']
		// 	}
		// }),
		alias: {
			$lib: './src/lib'
		}
	}
};

export default config;
