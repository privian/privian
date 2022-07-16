import extend from 'just-extend';
import config from '$lib/config';
import { request } from '$lib/helpers';
import { Actions } from '$lib/actions';
import { Commands } from '$lib/commands';
import type { IRequestOptions } from '$lib/types';

export class Api {
	static readonly apis: Map<string, Api> = new Map();

	static async load() {
		for (let { name, url } of config.apis) {
			const api = new Api(name, url);
			await api.loadDiscovery();
			this.apis.set(name, api);
		}
	}

	static get(name: string) {
		const api = this.apis.get(name);
		if (!api) {
			throw new Error(`Unknown API '${name}'.`);
		}
		return api;
	}

	static getUploadApi() {
		for (let [ name, api ] of this.apis) {
			if (api.uploadUrl) {
				return api;
			}
		}
	}

	uploadUrl?: string;

	constructor(readonly name: string, readonly url: string) {
	}

	async request(options: IRequestOptions, locals: App.Locals) {
		return request(extend(true, {
			headers: {
				'Authorization': locals.jwt ? `Bearer ${locals.jwt}` : '',
				'X-Country': locals.country,
				'X-Locale': locals.locale,
				'X-Region': locals.region,
				'X-User-Id': locals.user?.id || '',
				'X-User-Role': locals.user?.role || '',
			},
		}, options, {
			url: new URL(options.url, this.url).toString(),
		}) as IRequestOptions);
	}

	async loadDiscovery() {
		const resp = await request({
			url: new URL('/_discovery', this.url).toString(),
		});
		const specs = await resp.json();
		this.uploadUrl = specs.uploadUrl;
		if (specs.actions) {
			for (let action of specs.actions) {
				Actions.register({
					...action,
					api: this.name,
					url: `${this.url}${action.url}`,
				});
			}
		}
		if (specs.commands) {
			for (let command of specs.commands) {
				Commands.register({
					...command,
					api: this.name,
					url: `${this.url}${command.url}`,
				});
			}
		}
	}
}
