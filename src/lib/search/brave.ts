import * as cheerio from 'cheerio';
import duration from 'parse-duration';
import { XMLParser } from 'fast-xml-parser';
import { osLocaleSync } from 'os-locale';
import { i18n } from '$lib/i18n';
import { Cache } from '$lib/cache';
import { request } from '$lib/helpers';
import { sanitize } from '$lib/sanitizer';
import { FetchData } from '$lib/fetch-data';
import { ImplementsStatic, type ISearchOptions } from '$lib/types';
import type { ISearchQuery, ISearchResult, ISearchResultItem, ISearchResultItemDeeplink, ISearchSuggestionsResultItem, ISearchProvider, ITrendingItem } from '$lib/types';

@ImplementsStatic<ISearchProvider>()
export class Brave {
	static readonly URL_IMAGES = `https://search.brave.com/api/images`;

	static readonly URL_NEWS = `https://search.brave.com/news`;

	static readonly URL_SEARCH = `https://search.brave.com/search`;

	static readonly URL_VIDEOS = `https://search.brave.com/videos`;

	static readonly URL_SUGGESTIONS = `https://search.brave.com/api/suggest`;

	static readonly RESULTS_PER_PAGE = 50;

	static readonly USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.3`;

	static readonly cacheSuggestions = new Cache<ISearchSuggestionsResultItem[]>({
		lru: {
			max: 500,
		},
		ttl: duration('2h'),
	});

	static readonly cacheResults = new Cache<Partial<ISearchResult>>({
		redis: {
			prefixKey: 'brave:',
		},
		lru: {
			max: 100,
		},
		ttl: duration('20m'),
	});

	static async load() {
		return void 0;
	}

	static async publicMethod(method: string) {
		return void 0;
	}

	static async suggest(query: ISearchQuery, result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>) {
		if (!query.term || query.term === '!') {
			return void 0;
		}
		let items = await this.cacheSuggestions.get([locals.locale, query.term]);
		if (!items) {
			const resp = await request({
				headers: {
					'User-Agent': this.USER_AGENT,
				},
				searchParams: {
					source: 'web',
					rich: 'true',
					q: query.term,
				},
				url: this.URL_SUGGESTIONS,
			});
			const json = await resp.json();
			items = (json[1] || [])
				.slice(0, 10)
				.map((item: any) => {
					let description = item.desc?.trim();
					if (description) {
						description = description[0].toUpperCase() + description.slice(1);
					}
					return {
						description,
						icon: !item.img ? 'search-line' : void 0,
						image: item.img,
						label: String(item.q || item),
					};
				});
			await this.cacheSuggestions.set([locals.locale, query.term], items!);
		}
		if (!result.items) {
			result.items = [];
		}
		result.items.push(...items!);
	}

	static async search(query: ISearchQuery, prevResult: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>) {
		const categories = await this.getCategories(locals.locale);
		const category = options?.category || categories.web;
		const url = new URL(this.getURL(categories, category));
		const cacheKey = [locals.country, category, JSON.stringify(options?.filter || {}), query.term];
		let result = await this.cacheResults.get(cacheKey);
		if (!result) {
			const resp = await request({
				cookies: {
					'country': locals.country.toLowerCase(),
					'safesearch': locals.safeSearch ? 'strict' : 'off',
				},
				headers: {
					'User-Agent': this.USER_AGENT,
				},
				searchParams: {
					source: 'web',
					q: query.term,
					...options?.filter,
				},
				url: url.toString(),
			});
			switch (category) {
				case categories.images:
					result = {
						layout: 'gallery',
						items: this.parseImages(await resp.json(), categories, url.origin),
					};
					break;
				case categories.videos:
					result = {
						layout: 'cards',
						items: this.parseVideos(await resp.text(), categories, url.origin),
					};
					break;
				default:
					result = {
						items: this.parseDefault(await resp.text(), categories, url.origin),
					};
					break;
			}
			this.cacheResults.set(cacheKey, result);
		}
		if (!prevResult.categories) {
			prevResult.categories = Object.values(categories);
			prevResult.category = category;
		}
		if (!prevResult.filters?.length) {
			switch (category) {
				case categories.images:
					prevResult.filters = await this.getImageFilters(locals.locale);
					break;
				case categories.news:
					prevResult.filters = await this.getNewsFilters(locals.locale);
					break;
				case categories.videos:
					prevResult.filters = await this.getVideosFilters(locals.locale);
					break;
				case categories.web:
					prevResult.filters = await this.getWebFilters(locals.locale);
					break;
				default:
					break;
			}
		}
		if (result?.layout) {
			prevResult.layout = result.layout;
		}
		prevResult.items!.push(...result.items!);
	}

  protected static parseDefault(html: string, categories: Record<string, string>, origin: string) {
		const $ = cheerio.load(html);
		const $root = $('#results');
		const items: ISearchResultItem[] = [];
		const news: ISearchResultItem[] = [];
		const videos: ISearchResultItem[] = [];
		$root.find('.snippet').toArray().forEach((el) => {
			const $el = $(el);
			const title = $el.find('.snippet-title').text();
			const snippet = $el.find('.snippet-description').text();
			const link = $el.find('a').attr('href');
			const image = $el.find('img.thumb').attr('src');
			const $footer = $el.find('.snippet-url');
			let footer: string | undefined = void 0; 
			if (!$footer.find('.url-path').length) {
				footer = $footer.text().trim();
			}
			if (title && link) {
				items.push({
					footer,
					image,
					link,
					snippet,
					title,
				});
			}
		});
		$('#news-carousel .card').toArray().forEach((el) => {
			const item = this.parseCard($(el));
			if (item) {
				news.push(item);
			}
		});
		$('#video-carousel .card').toArray().forEach((el) => {
			const item = this.parseCard($(el));
			if (item) {
				videos.push(item);
			}
		});
		if (news.length) {
			items.splice(3, 0, {
				items: news.slice(0, 4),
				link: `?category=${categories.news}`,
				title: categories.news,
				type: 'cards',
			});
		}
		if (videos.length) {
			items.splice(6, 0, {
				items: videos.slice(0, 4),
				link: `?category=${categories.videos}`,
				title: categories.videos,
				type: 'cards',
			});
		}
		return items;
	}

  protected static parseImages(json: any, categories: Record<string, string>, origin: string) {
		if (json?.results) {
			return json.results.map((item: any) => {
				const size = `${item.properties?.width}&times;${item.properties?.height}`;
				return {
					footer: `${size} &bull; ${item.source}`,
					image: item.thumbnail?.src,
					link: item.url,
					options: {
						original: item.properties?.url,
					},
					title: item.title,
				};
			});
		}
		return [];
	}

  protected static parseVideos(html: string, categories: Record<string, string>, origin: string) {
		const $ = cheerio.load(html);
		const $root = $('#results');
		const items: ISearchResultItem[] = [];
		$root.find('.card').toArray().forEach((el) => {
			const item = this.parseCard($(el));
			if (item) {
				items.push(item);
			}
		});
		return items;
	}

	protected static parseCard($el: cheerio.Cheerio<cheerio.Element>) {
		const link = $el.is('a') ? $el.attr('href') : $el.find('a').attr('href');
		const title = $el.find('.title').text();
		const source = $el.find('.card-source').text().trim().replace(/^www\./, '');
		const footer = $el.find('.card-footer').text().trim().replace(/\‧/g, '&bull;');
		const image = $el.find('.card-image .img-bg').attr('style')?.match(/url\(\'([^\'\"]+)\'/)?.[1];
		const duration = $el.find('.duration').text();
		if (title && link) {
			return {
				labels: duration ? ['&#9658;&nbsp;' + duration] : void 0,
				footer: source ? `<span class="text-success">${source}</span> &bull; ${footer}` : footer,
				link,
				image,
				title,
			};
		}
	}

	protected static getURL(categories: Record<string, string>, category: string) {
		switch (category) {
			case categories.images:
				return this.URL_IMAGES;
			case categories.news:
				return this.URL_NEWS;
			case categories.videos:
				return this.URL_VIDEOS;
			default:
				return this.URL_SEARCH;
		}
	}
	
	protected static async getCategories(locale: string) {
		const t = await i18n(locale);
		return {
			web: t('label.web'),
			images: t('label.images'),
			news: t('label.news'),
			videos: t('label.videos'),
		};
	}

	protected static async getImageFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.size'),
			name: 'size',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.wallpaper'),
				value: 'Wallpaper',
			}, {
				label: t('label.large'),
				value: 'Large',
			}, {
				label: t('label.medium'),
				value: 'Medium',
			}, {
				label: t('label.small'),
				value: 'Small',
			}],
		}, {
			label: t('label.color'),
			name: 'color',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.monochrome'),
				value: 'Monochrome',
			}, {
				label: t('label.red'),
				value: 'Red',
			}, {
				label: t('label.orange'),
				value: 'Orange',
			}, {
				label: t('label.yellow'),
				value: 'Yellow',
			}, {
				label: t('label.green'),
				value: 'Green',
			}, {
				label: t('label.teal'),
				value: 'Teal',
			}, {
				label: t('label.blue'),
				value: 'Blue',
			}, {
				label: t('label.purple'),
				value: 'Purple',
			}, {
				label: t('label.pink'),
				value: 'Pink',
			}, {
				label: t('label.white'),
				value: 'White',
			}, {
				label: t('label.gray'),
				value: 'Gray',
			}, {
				label: t('label.black'),
				value: 'Black',
			}, {
				label: t('label.brown'),
				value: 'Brown',
			}],
		}, {
			label: t('label.type'),
			name: '_type',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.photo'),
				value: 'Photo',
			}, {
				label: t('label.clipart'),
				value: 'Clipart',
			}, {
				label: t('label.gif'),
				value: 'AnimatedGifHttps',
			}, {
				label: t('label.transparent'),
				value: 'Transparent',
			}],
		}, {
			label: t('label.time'),
			name: 'time',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'd',
			}, {
				label: t('label.past_week'),
				value: 'w',
			}, {
				label: t('label.past_month'),
				value: 'm',
			}, {
				label: t('label.past_year'),
				value: 'y',
			}],
		}];
	}

	protected static async getNewsFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'tf',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'pd',
			}, {
				label: t('label.past_week'),
				value: 'pw',
			}, {
				label: t('label.past_month'),
				value: 'pm',
			}],
		}];
	}

	protected static async getVideosFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'tf',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'pd',
			}, {
				label: t('label.past_week'),
				value: 'pw',
			}, {
				label: t('label.past_month'),
				value: 'pm',
			}],
		}, {
			label: t('label.length'),
			name: 'length',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.short'),
				value: 'short',
			}, {
				label: t('label.medium'),
				value: 'medium',
			}, {
				label: t('label.long'),
				value: 'long',
			}],
		}];
	}

	protected static async getWebFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'tf',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hour'),
				value: 'pd',
			}, {
				label: t('label.past_week'),
				value: 'pw',
			}, {
				label: t('label.past_month'),
				value: 'pm',
			}, {
				label: t('label.past_year'),
				value: 'py',
			}],
		}];
	}
}
