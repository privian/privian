import ggdbangs from '$lib/data/bangs';
import config from '$lib/config';
import type { IBangOptions, ISearchQuery, ISearchSuggestionsResultItem } from '$lib/types';

export class Bangs {
	static bangs: Map<string, IBangOptions> = new Map();

	static register(bang: string, options: IBangOptions) {
		this.bangs.set(bang.replace(/^\!/, ''), options);
	}

	static get(bang: string): IBangOptions | undefined {
		return this.bangs.get(bang.replace(/^\!/, ''));
	}

	static suggest(query: ISearchQuery, maxItems: number = 10): ISearchSuggestionsResultItem[] {
		const bangs: Array<IBangOptions & { bang: string }> = [];
		if ((query.bang && !query.term) || query.term === '!') {
			for (let [ bang, options ] of this.bangs) {
				if (
					query.term === '!'
					|| (query.bang && bang.startsWith(query.bang))
					|| (query.term && bang.startsWith(query.term))
				) {
					bangs.push({
						bang,
						...options,
					});
				}
			}
			return bangs.sort((a, b) => {
				return a.priority > b.priority ? -1 : 0;
			}).reduce((acc, item) => {
				if (!acc.find(({ label, url }) => label === item.label || url === item.url)) {
					acc.push(item);
				}
				return acc;
			}, [] as Array<IBangOptions & { bang: string }>).slice(0, maxItems).map(({ bang, label }) => {
				return {
					bang,
					label,
				};
			});
		}
		return [];
	}
}

if (config.bangs?.enable !== false) {
	for (let bang of ggdbangs) {
		if ((!config.bangs?.blacklist?.includes(bang.t) && !config.bangs?.whitelist) || config.bangs?.whitelist?.includes(bang.t)) {
			Bangs.register(bang.t, {
				label: bang.s,
				priority: bang.r,
				url: bang.u,
			});
		}

		if (config.bangs?.add) {
			for (let bang in config.bangs.add) {
				Bangs.register(bang, config.bangs.add[bang]);
			}
		}
	}
}