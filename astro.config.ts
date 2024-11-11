import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { gitCommitHash } from 'utilium/fs.js';

export default defineConfig({
	output: 'server',
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
		imageService: 'cloudflare',
	}),
	site: 'https://iit-journey.pages.dev/',
	redirects: {
		'/.well-known/change-password': '/profile?edit=password',
		'/github': 'https://github.com/iit-a-star/journey',
		'/github/[...rest]': 'https://github.com/iit-a-star/journey/[...rest]',
	},
	markdown: {
		shikiConfig: {
			theme: 'monokai',
		},
	},

	vite: {
		ssr: {
			external: ['node:crypto'],
		},
		define: {
			$revision: JSON.stringify(gitCommitHash()),
		},
	},
});
