import { BadRequestError } from '$lib/errors';
import { readResponseBody } from '$lib/helpers';
import { Api } from '$lib/api';
import type { IAction } from '$lib/types';

export class Actions {
	static actions: Map<string, IAction> = new Map();

	static register(action: IAction) {
		this.actions.set(action.id, action);
	}

	static get(actionId: string) {
		const action = this.actions.get(actionId);
		if (!action) {
			throw new BadRequestError(`Unknown action '${actionId}'.`);
		}
		return action;
	}

	static async view(actionId: string, locals: App.Locals, params: Record<string, string>) {
		const action = this.get(actionId);
		if (!action.viewUrl) {
			return null;
		}	
		return readResponseBody(await Api.get(action.api).request({
			searchParams: params,
			url: action.viewUrl,
		}, locals));
	}

	static async submit(actionId: string, locals: App.Locals, params: Record<string, string>, data: Record<string, any>) {
		const action = this.get(actionId);
		if (!action.url) {
			return null;
		}
		return readResponseBody(await Api.get(action.api).request({
			body: data,
			method: action.method || 'POST',
			searchParams: params,
			url: action.url.replace(/\$(\w+)/g, (m, key) => {
				return params[key] || m;
			}),
		}, locals));
	}
}
