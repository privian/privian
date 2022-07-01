import { BadRequestError } from '$lib/api/errors';
import type { ISearchResult, ISearchQuery, ISearchSuggestionsResultItem } from '$lib/types';

type CommandHandler = ((locals: App.Locals) => Promise<ISearchResult>);

interface ICommandOptions {
	label: string;
	handler: CommandHandler;
}

export class Commands {
	static commands: Map<string, ICommandOptions> = new Map();

	static register(cmd: string, options: ICommandOptions) {
		this.commands.set(cmd, options);
	}

	static async handle(cmd: string, locals: App.Locals): Promise<ISearchResult> {
		const options = this.commands.get(cmd);
		if (!options?.handler) {
			throw new BadRequestError(`Unknown command '${cmd}'.`);
		}
		return options.handler.call(void 0, locals);
	}

	static suggest(query: ISearchQuery, maxItems: number = 20) {
		const items: ISearchSuggestionsResultItem[] = [];
		for (let [ command, options ] of this.commands) {
			if (
				query.term === '/'
				|| (query.command && command.startsWith(query.command))
				|| (query.term && command.startsWith(query.term))
			) {
				items.push({
					command,
					label: options.label,
				});
			}
		}
		return items.sort((a, b) => a.label.localeCompare(b.label)).slice(0, maxItems);
	}
}

