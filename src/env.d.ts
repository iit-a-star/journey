/// <reference types="astro/client" />

// import type { D1Database } from '@cloudflare/workers-types';
// import type { Runtime } from '@astrojs/cloudflare';

type D1Database = import('@cloudflare/workers-types').D1Database;

type ENV = {
	DB: D1Database;
};

type Runtime = import('@astrojs/cloudflare').Runtime<ENV>;

declare namespace App {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface Locals extends Runtime {}
}

// export {};
