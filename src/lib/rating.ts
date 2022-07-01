import { FetchData } from '$lib/fetch-data';

export class Rating {
	static readonly DATA_NAME = 'privacyspy.org';

	static readonly DATA_URL = 'https://privacyspy.org/api/v2/index.json';

	static data: Map<string, any> = new Map();

	static async load() {
		const data = await FetchData.get(this.DATA_NAME);
		if (data) {
			const items = JSON.parse(data);
			for (let item of items) {
				for (let hostname of item.hostnames) {
					this.data.set(hostname, item);
				}
			}
		}
	}

	static get(domain: string) {
		if (domain.startsWith('www.')) {
			domain = domain.replace(/^www\./, '');
		}
		return this.data.get(domain) || this.data.get(domain.replace(/^[^\.]+\.([^\.]+\.[^\.]+)/, '$1'));
	}
}


FetchData.events.on(`fetch:${Rating.DATA_NAME}`, () => Rating.load());
FetchData.registerFetch(Rating.DATA_NAME, '0 R R * * *', Rating.DATA_URL);

Rating.load();