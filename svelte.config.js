// Cloudflare adapter for Cloudflare Pages deployment
import adapter from '@sveltejs/adapter-cloudflare';
// Node adapter - use for Docker deployment
// import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Cloudflare adapter for Cloudflare Pages
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		}),
		// Node adapter (for Docker deployment)
		// adapter: adapterNode({
		// 	out: 'build',
		// 	precompress: false,
		// 	envPrefix: ''
		// }),
		alias: {
			$lib: './src/lib'
		}
	}
};

export default config;
