import config from '$lib/config';
import * as providers from '$lib/search/';
import type { ISearchProvider } from '$lib/types';

export class Providers {
	static providers: Map<string, ISearchProvider> = new Map();

	static register(name: string, provider: ISearchProvider) {
		this.providers.set(name, provider);
	}

	static get(name: string) {
		return this.providers.get(name);
	}

	static async load() {
		for (let name in providers) {
			if (!config.providers.disable?.includes(name)) {
				// @ts-ignore
				const cls = providers[name]
				Providers.register(name, cls);
				await cls.load();
			}
		}
	}
}
