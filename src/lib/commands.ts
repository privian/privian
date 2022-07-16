import { BadRequestError } from '$lib/errors';
import { Api } from '$lib/api';
import type { ICommand, ISearchQuery, ISearchSuggestionsResultItem } from '$lib/types';

export class Commands {
	static commands: Map<string, ICommand> = new Map();

	static register(cmd: ICommand) {
		this.commands.set(cmd.id, cmd);
	}

	static async invoke(command: string, locals: App.Locals) {
		const cmd = this.commands.get(command);
		if (!cmd) {
			throw new BadRequestError(`Unknown command '${command}'.`);
		}
		const resp = await Api.get(cmd.api).request({
			method: cmd.method,
			url: cmd.url,
		}, locals);
		return resp.json();
	}

	static suggest(query: ISearchQuery, maxItems: number = 20) {
		const items: ISearchSuggestionsResultItem[] = [];
		for (let [ id, options ] of this.commands) {
			if (
				query.term === '/'
				|| (query.command && id.startsWith(query.command))
				|| (query.term && id.startsWith(query.term))
			) {
				items.push({
					command: id,
					label: options.description || '',
				});
			}
		}
		return items.sort((a, b) => a.label.localeCompare(b.label)).slice(0, maxItems);
	}
}

