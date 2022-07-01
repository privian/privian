import config from '$lib/config';
import { Bangs } from '$lib/bangs';
import { Commands } from '$lib/commands';
import { Providers } from '$lib/providers';
import { Search } from '$lib/search';
import { sanitizeDeep } from '$lib/sanitizer';
import type { ISearchSuggestionsResult, ISearchOptions } from '$lib/types';

export class Suggestions {
	static async suggest(term: string, locals: App.Locals, options: ISearchOptions = {}) {
		const query = Search.parseTerm(term);
		const bangs = Bangs.suggest(query);
		const commands = Commands.suggest(query);
		let result: ISearchSuggestionsResult = {
			items: [...bangs, ...commands],
		};
		if (config.providers.suggestions) {
			for (let provider of config.providers.suggestions) {
				if (provider) {
					const providerResult = await Providers.get(provider)?.suggest(query, result, options, locals, {});
					if (providerResult) {
						result = providerResult;
					}
				}
			}
		}
		return sanitizeDeep(result);
	}
}
