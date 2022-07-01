import { BadRequestError } from '$lib/api/errors';
import type { ActionHandler, ActionSubmitResponse } from '$lib/types';

export class Actions {
	static actions: Map<string, ActionHandler> = new Map();

	static register(cmd: string, handler: ActionHandler) {
		this.actions.set(cmd, handler);
	}

	static async get(cmd: string, params: Record<string, string>, locals: App.Locals) {
		const handler = this.actions.get(cmd);
		if (!handler?.get) {
			throw new BadRequestError(`Unknown action '${cmd}'.`);
		}
		return handler.get.call(void 0, params, locals);
	}

	static async submit(cmd: string, params: Record<string, string>, data: Record<string, any>, locals: App.Locals): Promise<ActionSubmitResponse> {
		const handler = this.actions.get(cmd);
		if (!handler) {
			throw new BadRequestError(`Unknown action '${cmd}'.`);
		}
		return handler.submit.call(void 0, params, data, locals);
	}

}
