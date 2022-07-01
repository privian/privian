import { XMLParser } from 'fast-xml-parser';
import { formatCurrency } from '$lib/format';
import { FetchData } from '$lib/fetch-data';
import { ImplementsStatic } from '$lib/types';
import type { ISearchQuery, ISearchResult, ISearchProvider } from '$lib/types';

@ImplementsStatic<ISearchProvider>()
export class Currency {
	static DATA_NAME = 'currency';

	static DATA_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml?47ba794a7624ddb151d90babafa622dc';

	static data: Array<{
		date: string,
		rates: Record<string, number>;
	}> | null = null;

	static currenciesRegExp?: RegExp;

	static get currencies() {
		if (!this.data?.length) {
			return [];
		}
		return ['EUR', ...Object.keys(this.data[0].rates)];
	}

	static async load() {
		FetchData.events.on(`fetch:${this.DATA_NAME}`, () => this.loadXML());
		FetchData.registerFetch(this.DATA_NAME, '0 R 17 * * *', this.DATA_URL);
		await this.loadXML();
	}

	static async suggest() {
		return void 0;
	}

	static async search(query: ISearchQuery, result: ISearchResult) {
		const hasCurrency = result.items?.find(({ type }) => type === 'currency');
		if (!hasCurrency && this.currenciesRegExp) {
			const match = query.term.match(this.currenciesRegExp);
			if (match?.length) {
				const amountMatch = query.term.match(/(\d+([\,\s]?\d){0,}(\.\d+)?)/);
				const amount: number = parseFloat(amountMatch?.[1]?.replace(/\,|\s/g, '') || '1');
				const currencies = match.map((item) => item.toUpperCase());
				if (currencies.length === 1) {
					currencies.push(currencies[0] === 'EUR' ? 'USD' : 'EUR');
				}
				const rate = await this.getExchangeRate(currencies[0], currencies[1], amount);
				if (rate !== null) {
					result.items?.splice(0, 0, {
						options: {
							amount,
							from: currencies[0],
							rates: this.data,
							result: rate,
							to: currencies[1],
						},
						title: 'Exchange rates',
						type: 'currency',
						source: 'European Central Bank',
						subtitle: `${amount} ${formatCurrency(currencies[0])}`
					});
				}
			}
		}
	}

	static async publicMethod(method: string) {
		switch (method) {
			case 'rates':
				await this.load();
				return this.data;
		}
	}

	static async getExchangeRate(from: string, to: string, amount: number = 1) {
		if (!this.data || this.data.length === 0) {
			return null;
		}
		const rates = this.data[0]?.rates;
		if (!rates) {
			throw new Error('Unable to fetch currency exchange rates.');
		}
		if (from === to) {
			return 1;
		}
		let result: number;
		if (from === 'EUR' && rates[to]) {
			result = rates[to] * amount;
		} else if (to === 'EUR' && rates[from]) {
			result = 1 / rates[from] * amount;
		} else {
			result = (rates[to] / rates[from]) * amount;
		}
		const rounding = result < 1 ? 1000000 : 1000;
		return Math.round(result * rounding) / rounding;
	}

	static async loadXML() {
		const data = await FetchData.get(this.DATA_NAME);
		if (data) {
			const parser = new XMLParser({
				ignoreAttributes: false,
			});
			const result = [];
			try {
				const xml = parser.parse(data);
				for (let item of xml['gesmes:Envelope']['Cube']['Cube']) {
					const rates = item['Cube'].reduce((acc: any, item: any) => {
						acc[item['@_currency']] = parseFloat(item['@_rate']);
						return acc;
					}, {});
					result.push({
						date: item['@_time'],
						rates,
					});
				}
			} catch (err) {
				return false;
			}
			this.data = result;
			this.currenciesRegExp = new RegExp(`\\b(${this.currencies.join('|')})\\b`, 'ig');
			return true;
		}
		return false;
	}
}

