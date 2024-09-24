/* eslint-disable @typescript-eslint/consistent-type-imports,@typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { D1Database } from '@cloudflare/workers-types';
import type { Runtime } from '@astrojs/cloudflare';

type __ENV = {
	DB: /*import('@cloudflare/workers-types').*/ D1Database;
};

// type Runtime = import('@astrojs/cloudflare').Runtime<__ENV>;

declare global {
	namespace App {
		interface Locals extends Runtime<__ENV> {
			__help__: 'me';
		}
	}
}

// export {};
