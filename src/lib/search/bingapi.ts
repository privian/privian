import duration from 'parse-duration';
import { Cache } from '$lib/cache';
import { BadRequestError } from '$lib/api/errors';
import { formatTimeAgo } from '$lib/format';
import { request } from '$lib/helpers';
import { i18n } from '$lib/i18n';
import { ImplementsStatic } from '$lib/types';
import type { ISearchQuery, ISearchResult, ISearchResultItem, ISearchSuggestionsResultItem, ISearchProvider, ISearchOptions } from '$lib/types';

interface IBingIntegrationWebPage {
	dateLastCrawled?: string;
	deepLinks: {
		name: string;
		snippet: string;
		url: string;
	}[];
	url: string;
	language: string;
	isFamilyFriendly: boolean;
	name: string;
	snippet: string;
}

interface IBingSearchResponse {
	error?: {
		code?: string;
		message?: string;
	};
	computation?: {
		expression: string;
		value: string;
	};
	entities?: {
		value: {
			contractualRules: {
				licenseNotice?: string;
				targetPropertyName: string;
				text?: string;
				url?: string;
			}[];
			description: string;
			entityPresentationInfo?: {
				entityTypeHints: string[];
			};
			image?: {
				thumbnailUrl: string;
			};
			name: string;
		}[];
	};
	news?: {
		value: {
			contractualRules: {
				text: string;
			}[];
			datePublished?: string;
			description: string;
			image?: {
				thumbnail: {
					contentUrl: string;
				};
			};
			name: string;
			url: string;
		}[];
	};
	webPages: {
		totalEstimatedMatches?: number;
		value: IBingIntegrationWebPage[];
	};
	relatedSearches?: {
		value: {
			displayText: string;
			webSearchUrl: string;
		}[];
	};
	timeZone?: {
		primaryCityTime: {
			location: string;
			time: string;
		},
		primaryTimeZone: {
			location: string;
			time: string;
			utcOffset: string;
			timeZoneName: string;
		},
	};
	translations?: {
		attributions: {
			providerDisplayName: string;
			seeMoreUrl: string;
		}[];
		originalText: string;
		translatedText: string;
	};
	images?: {
		webSearchUrl: string;
		value: {
			name: string;
			hostPageUrl: string;
			thumbnailUrl: string;
		}[];
	};
	videos?: {
		webSearchUrl: string;
		value: {
			contentUrl: string;
			datePublished?: string;
			description?: string;
			duration?: string;
			name: string;
			publisher: {
				name: string;
			}[];
			thumbnailUrl: string;
			viewCount?: number;
		}[];
	};
}

interface IBingSuggestionsResult {
	error?: {
		code?: string;
		message?: string;
	},
	suggestionGroups: {
		searchSuggestions: {
			displayText: string;
		}[];
	}[];
}

@ImplementsStatic<ISearchProvider>()
export class BingApi {
	static readonly API_KEY = process.env.PRIVIAN_BING_API_KEY!;

	static readonly URL_SUGGESTIONS = `https://api.bing.microsoft.com/v7.0/suggestions`;

	static readonly URL_SEARCH_WEB = `https://api.bing.microsoft.com/v7.0/search`;

	static readonly URL_SEARCH_IMAGES = `https://api.bing.microsoft.com/v7.0/images/search`;

	static readonly URL_SEARCH_NEWS = `https://api.bing.microsoft.com/v7.0/news/search`;

	static readonly URL_SEARCH_VIDEOS = `https://api.bing.microsoft.com/v7.0/videos/search`;

	static readonly cacheSuggestions = new Cache<ISearchSuggestionsResultItem[]>({
		lru: {
			max: 500,
		},
		ttl: duration('2h'),
	});

	static readonly cacheResults = new Cache<Partial<ISearchResult>>({
		redis: {
			prefixKey: 'bing:',
		},
		lru: {
			max: 100,
		},
		ttl: duration('20m'),
	});

	static async load() {
		return void 0;
	}

	static async publicMethod() {
		return void 0;
	}

	static async suggest(query: ISearchQuery, result: ISearchResult, _options: ISearchOptions, locals: App.Locals) {
		if (!query.term || query.term === '!') {
			return void 0;
		}
		let items = await this.cacheSuggestions.get([locals.locale, query.term]);
		if (!items) {
			const resp = await request(this.URL_SUGGESTIONS, {
				mkt: locals.locale,
				q: query.term,
				textFormat: 'html',
			}, {
				headers: {
					'Ocp-Apim-Subscription-Key': this.API_KEY,
				},
			});
			const data: IBingSuggestionsResult = await resp.json();
			if (resp.status !== 200) {
				throw new BadRequestError(`Bing error: ${data.error?.message || resp.status}`);
			}
			items = data.suggestionGroups && data.suggestionGroups[0]?.searchSuggestions?.map((item: any) => {
				return {
					label: item.displayText,
				};
			});
			this.cacheSuggestions.set([locals.locale, query.term], items);
		}
		result.items?.push(...items.map((item) => {
			if (query.bang) {
				return {
					label: `!${query.bang} ${item.label}`,
				};
			}
			return item;
		}));
	}

	static async search(query: ISearchQuery, prevResult: ISearchResult, options: ISearchOptions, locals: App.Locals, scope: Record<string, any>) {
		const categories = await this.getCategories(locals.locale);
		const category = options?.category || categories.web;
		const cacheKey = [locals.region, category, JSON.stringify(options?.filter || {}), query.term];
		let result = await this.cacheResults.get(cacheKey);
		if (true || !result) {
			switch (category) {
				case categories.images:
					result = await this.searchImages(query, prevResult, options, locals, scope);
					break;
				case categories.news:
					result = await this.searchNews(query, prevResult, options, locals, scope);
					break;
				case categories.videos:
					result = await this.searchVideos(query, prevResult, options, locals, scope);
					break;
				default:
					result = await this.searchWeb(query, prevResult, options, locals, scope);
			}
			await this.cacheResults.set(cacheKey, result);
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
					prevResult.filters = await this.getVideoFilters(locals.locale);
					break;
				default:
					prevResult.filters = await this.getWebFilters(locals.locale);
			}
		}
		if (result?.layout) {
			prevResult.layout = result.layout;
		}
		prevResult.items!.push(...result.items!);
	}

	static async searchWeb(query: ISearchQuery, _result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>): Promise<Partial<ISearchResult>> {
		const categories = await this.getCategories(locals.locale);
		const resp = await request(this.URL_SEARCH_WEB, {
			count: '50',
			mkt: locals.region,
			q: query.term,
			textFormat: 'html',
			...options?.filter,
		}, {
			headers: {
				'Ocp-Apim-Subscription-Key': this.API_KEY,
			},
		});
		const data: IBingSearchResponse = await resp.json();
		let items: ISearchResultItem[] = [];
		if (resp.status !== 200) {
			throw new BadRequestError(`Bing error: ${data.error?.message || resp.status}`);
		}
		if (data.webPages) {
			items.push(...this.regroupResults(data.webPages.value.map((item) => {
				return {
					crawledAt: item.dateLastCrawled ? new Date(item.dateLastCrawled).getTime() : void 0,
					deeplinks: item.deepLinks?.map((link) => {
						return {
							link: this.fixLink(link.url),
							snippet: link.snippet,
							title: link.name,
						};
					}),
					snippet: item.snippet,
					language: item.language,
					link: this.fixLink(item.url),
					safe: item.isFamilyFriendly !== false,
					source: 'Microsoft Bing',
					title: item.name,
				};
			})));
		}

		if (data.images) {
			items.splice(6, 0, {
				items: data.images.value?.slice(0, 5).map((item) => {
					return {
						image: this.fixImageUrl(item.thumbnailUrl),
						link: this.fixLink(item.hostPageUrl),
						title: item.name,
					};
				}),
				link: `?category=${categories.images}`,
				title: categories.images,
				type: 'gallery',
			});
		}

		if (data.videos) {
			items.splice(3, 0, {
				items: data.videos.value?.slice(0, 3).map((item) => {
					return {
						footer: item.publisher[0]?.name ? `<a href="${this.fixLink(item.contentUrl)}">${item.publisher[0].name}</a>` : '',
						image: this.fixImageUrl(item.thumbnailUrl),
						labels: item.duration ? ['&#9658;&nbsp;' + this.parseVideoDuration(item.duration)] : void 0,
						link: this.fixLink(item.contentUrl),
						snippet: item.description,
						timestamp: item.datePublished ? new Date(item.datePublished).getTime() : void 0,
						title: item.name,
					};
				}),
				link: `?category=${categories.videos}`,
				title: categories.videos,
				type: 'cards',
			});
		}

		if (data.news) {
			items.splice(3, 0, {
				items: data.news.value?.slice(0, 3).map((item) => {
					return {
						footer: item.contractualRules[0]?.text ? `<a href="${this.fixLink(item.url)}">${item.contractualRules[0].text}</a>` : '',
						image: item.image?.thumbnail.contentUrl ? this.fixImageUrl(item.image?.thumbnail.contentUrl) : '',
						layout: 'cards',
						link: item.url,
						snippet: `<div class="text-clamp-3">${item.description}</div>`,
						timestamp: item.datePublished ? new Date(item.datePublished).getTime() : void 0,
						title: item.name,
					};
				}),
				link: `?category=${categories.news}`,
				title: categories.news,
				type: 'cards',
			});
		}

		if (data.computation) {
			const t = await i18n(locals.locale);
			items.splice(0, 0, {
				options: {
					expression: query.term,
					result: data.computation.value,
				},
				title: t('label.calculator'),
				type: 'calculator',
			});
		}
		return {
			items,
		};
	}

	static async searchImages(query: ISearchQuery, _result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>): Promise<Partial<ISearchResult>> {
		const resp = await request(this.URL_SEARCH_IMAGES, {
			count: '100',
			mkt: locals.region,
			q: query.term,
			...options?.filter,
		}, {
			headers: {
				'Ocp-Apim-Subscription-Key': this.API_KEY,
			},
		});
		const data = await resp.json();
		if (resp.status !== 200) {
			throw new BadRequestError(`Bing error: ${data.error?.message || resp.status}`);
		}
		return {
			layout: 'gallery',
			items: data?.value?.map((image: any) => {
				const size = `${image.width}&times;${image.height}`;
				const hostname = new URL(image.hostPageUrl).hostname.replace(/^www\./, '');
				return {
					footer: `${size} &bull; ${hostname}`,
					link: image.hostPageUrl,
					image: image.thumbnailUrl,
					options: {
						original: image.contentUrl,
					},
					title: image.name,
				};
			}),
		};
	}

	static async searchNews(query: ISearchQuery, _result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>): Promise<Partial<ISearchResult>> {
		const resp = await request(this.URL_SEARCH_NEWS, {
			count: '50',
			mkt: locals.region,
			q: query.term,
			textFormat: 'html',
			...options?.filter,
		}, {
			headers: {
				'Ocp-Apim-Subscription-Key': this.API_KEY,
			},
		});
		const data = await resp.json();
		if (resp.status !== 200) {
			throw new BadRequestError(`Bing error: ${data.error?.message || resp.status}`);
		}
		return {
			items: data?.value?.map((item: any) => {
				return {
					crawledAt: item.datePublished ? new Date(item.datePublished).getTime() : void 0,
					footer: `${formatTimeAgo(item.datePublished)} &bull; ${item.provider[0]?.name}`,
					link: item.url,
					image: item.image?.thumbnail?.contentUrl,
					snippet: item.description,
					title: item.name,
				};
			}),
		};
	}

	static async searchVideos(query: ISearchQuery, _result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>): Promise<Partial<ISearchResult>> {
		const resp = await request(this.URL_SEARCH_VIDEOS, {
			count: '100',
			mkt: locals.region,
			q: query.term,
			textFormat: 'html',
			...options?.filter,
		}, {
			headers: {
				'Ocp-Apim-Subscription-Key': this.API_KEY,
			},
		});
		const data = await resp.json();
		if (resp.status !== 200) {
			throw new BadRequestError(`Bing error: ${data.error?.message || resp.status}`);
		}
		return {
			layout: 'cards',
			items: data?.value?.map((item: any) => {
				return {
					footer: item.publisher[0]?.name ? `<a href="${this.fixLink(item.contentUrl)}">${item.publisher[0].name}</a>` : '',
					image: this.fixImageUrl(item.thumbnailUrl),
					labels: item.duration ? ['&#9658;&nbsp;' + this.parseVideoDuration(item.duration)] : void 0,
					link: this.fixLink(item.contentUrl),
					snippet: `<div class="text-clamp-3">${item.description}</div>`,
					timestamp: item.datePublished ? new Date(item.datePublished).getTime() : void 0,
					title: item.name,
				};
			}),
		};
	}

	protected static regroupResults(items: ISearchResultItem[]) {
		return Object.values(items.reduce((acc, item) => {
			if (item.link) {
				const url = new URL(item.link);
				if (acc[url.hostname]) {
					if (!acc[url.hostname].items) {
						acc[url.hostname].items = [];
					}
					acc[url.hostname].items!.push(item);
				} else {
					acc[url.hostname] = item;
				}
			}
			return acc;
		}, {} as Record<string, ISearchResultItem>));
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

	protected static async getWebFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'freshness',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'Day',
			}, {
				label: t('label.past_week'),
				value: 'Week',
			}, {
				label: t('label.past_month'),
				value: 'Month',
			}],
		}];
	}

	protected static async getNewsFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.sort'),
			name: 'sortBy',
			options: [{
				label: t('label.relevance'),
				value: 'Relevance',
			}, {
				label: t('label.date'),
				value: 'Date',
			}],
		}, {
			label: t('label.time'),
			name: 'freshness',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'Day',
			}, {
				label: t('label.past_week'),
				value: 'Week',
			}, {
				label: t('label.past_month'),
				value: 'Month',
			}],
		}];
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
			name: 'imageType',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.clipart'),
				value: 'Clipart',
			}, {
				label: t('label.line_drawing'),
				value: 'Line',
			}, {
				label: t('label.gif'),
				value: 'AnimatedGif',
			}, {
				label: t('label.transparent'),
				value: 'Transparent',
			}, {
				label: t('label.shopping'),
				value: 'Shopping',
			}],
		}, {
			label: t('label.time'),
			name: 'freshness',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'Day',
			}, {
				label: t('label.past_week'),
				value: 'Week',
			}, {
				label: t('label.past_month'),
				value: 'Month',
			}],
		}];
	}

	protected static async getVideoFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.length'),
			name: 'videoLength',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.long'),
				value: 'Long',
			}, {
				label: t('label.medium'),
				value: 'Medium',
			}, {
				label: t('label.short'),
				value: 'Short',
			}],
		}, {
			label: t('label.time'),
			name: 'freshness',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_24_hours'),
				value: 'Day',
			}, {
				label: t('label.past_week'),
				value: 'Week',
			}, {
				label: t('label.past_month'),
				value: 'Month',
			}],
		}];
	}


	protected static fixLink(url: string) {
		if (url.match(/^https?\:\/\//)) {
			return url;
		}
		return `https://${url}`;
	}

	protected static fixImageUrl(url: string) {
		if (!url) {
			return url;
		}
		const u = new URL(url)
		u.searchParams.set('w', '480');
		u.searchParams.delete('h');
		return u.toString();
	}

	protected static parseVideoDuration(duration: string) {
		const match = duration.match(/PT((\d+)H)?((\d+)M)?((\d+)S)?/);
		return match ? [
			match[2]?.padStart(2, '0') || '',
			match[4]?.padStart(2, '0') || '00',
			match[6]?.padStart(2, '0') || '00',
		].filter(s => !!s).join(':') : duration;
	}
}
