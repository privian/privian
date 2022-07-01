import config from '$lib/config';
import { Commands } from '$lib/commands';
import { Bangs } from '$lib/bangs';
import { Preview } from '$lib/preview';
import { Providers } from '$lib/providers';
import { Rating } from '$lib/rating';
import { sanitizeDeep } from '$lib/sanitizer';
import { BadRequestError } from '$lib/api/errors';
import type { ISearchQuery, ISearchResult, ISearchOptions } from '$lib/types';

export class Search {
	static async search(term: string, locals: App.Locals, options: Partial<ISearchOptions>): Promise<ISearchResult> {
		const scope: Record<string, any> = {};
		const query = this.parseTerm(term);
		if (query.bang) {
			const bang = Bangs.get(query.bang);
			if (bang?.url) {
				return {
					redirect: bang.url.replace(/\%s/g, query.term),
				};
			}
		}
		let result: ISearchResult = {
			items: [],
		};
		if (query.command) {
			try {
				result = await Commands.handle(query.command!, locals);
			} catch (err) {
				if (err instanceof BadRequestError) {
					result = {
						notice: err.message,
					};
				}
				throw err;
			}

		} else if (config.providers.search) {
			for (let provider of config.providers.search) {
				const handlerResult = await Providers.get(provider)?.search(query, result, options, locals, scope);
				if (handlerResult) {
					result = handlerResult;
				}
			}
		}
		return this.sanitizeResult(result);
	}

	static parseTerm(term: string): ISearchQuery {
		const result = term.trim().split(/\s+/).reduce((acc, word, i) => {
			if (i === 0 && word.startsWith('!') && word.length > 1) {
				acc.bang = word.trim().slice(1);
			} else if (i === 0 && word.startsWith('/') && word.length > 1) {
				acc.command = word.trim().slice(1);
			} else {
				acc.term.push(word);
			}
			return acc;
		}, {
			command: null,
			term: [] as string[],
			bang: null,
		} as ISearchQuery & { term: string[] });
		return {
			...result,
			term: result.term.join(' '),
		};
	}

	static sanitizeResult(result: ISearchResult) {
		if (result?.items) {
			for (let item of result.items) {
				const hostname = item.link && new URL(item.link, 'https://localhost').hostname;
				const rating = hostname && Rating.get(hostname);
				if (rating?.score !== void 0) {
					item.privacyScore = rating.score;
				}
				if (item.link && item.preview === void 0 && Preview.canPreview(item.link)) {
					item.preview = true;
				}
				if (item.deeplinks) {
					for (let deeplink of item.deeplinks) {
						if (deeplink.link && deeplink.preview === void 0 && Preview.canPreview(deeplink.link)) {
							deeplink.preview = true;
						}
					}
				}
				if (item.items) {
					for (let subitem of item.items) {
						if (subitem.link && subitem.preview === void 0 && Preview.canPreview(subitem.link)) {
							subitem.preview = true;
						}
					}
				}
			}
		}
		return sanitizeDeep(result);
	}
}
