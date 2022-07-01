import * as cheerio from 'cheerio';
import duration from 'parse-duration';
import puppeteer from 'puppeteer-core';
import { XMLParser } from 'fast-xml-parser';
import { osLocaleSync } from 'os-locale';
import config from '$lib/config';
import { i18n } from '$lib/i18n';
import { Cache } from '$lib/cache';
import { request } from '$lib/helpers';
import { sanitize } from '$lib/sanitizer';
import { FetchData } from '$lib/fetch-data';
import { ImplementsStatic, type ISearchOptions } from '$lib/types';
import type { ISearchQuery, ISearchResult, ISearchResultItem, ISearchResultItemDeeplink, ISearchSuggestionsResultItem, ISearchProvider, ITrendingItem } from '$lib/types';

@ImplementsStatic<ISearchProvider>()
export class Google {
	static readonly LOCALE = osLocaleSync();

	static readonly DATA_TRENDING = 'google_trending';

	static readonly URL_SEARCH = `https://www.google.com/search`;

	static readonly URL_SUGGESTIONS = `https://www.google.com/complete/search`;

	static readonly URL_TRENDING = `https://trends.google.co.uk/trends/trendingsearches/daily/rss?geo=${Google.LOCALE.match(/-(\w+)/)?.[1] || 'US'}`;

	static readonly RESULTS_PER_PAGE = 50;

	static readonly cookies: Record<string, string> = {};

	static readonly cacheSuggestions = new Cache<ISearchSuggestionsResultItem[]>({
		lru: {
			max: 500,
		},
		ttl: duration('2h'),
	});

	static readonly cacheResults = new Cache<Partial<ISearchResult>>({
		redis: {
			prefixKey: 'google:',
		},
		lru: {
			max: 100,
		},
		ttl: duration('20m'),
	});

	static readonly trending = new Set<ITrendingItem>();

	static async load() {
		FetchData.events.on(`fetch:${this.DATA_TRENDING}`, () => this.loadTrending());
		FetchData.registerFetch(this.DATA_TRENDING, '0 R * * * *', this.URL_TRENDING, true);
		await this.loadTrending();
	}

	static async publicMethod(method: string) {
		switch (method) {
			case 'trending':
				return [...this.trending];
			default:
				// noop
		}
		return void 0;
	}

	static async suggest(query: ISearchQuery, result: ISearchResult, options: ISearchOptions, locals: App.Locals, _scope: Record<string, any>) {
		if (options.category === 'trending') {
			return {
				notice: 'Trending on Google',
				items: [...this.trending].map((item) => {
					return {
						aside: item.footer,
						icon: 'arrow-right-up-line',
						label: item.label,
					};
				}),
			};
		}
		if (!query.term || query.term === '!') {
			return void 0;
		}
		let items = await this.cacheSuggestions.get([locals.locale, query.term]);
		if (!items) {
			const resp = await request(this.URL_SUGGESTIONS, {
				client: 'gws-wiz',
				xssi: 't',
				hl: locals.region.split(/[\-\_]/)[0],
				q: query.term,
			});
			const text = await resp.text();
			const json = JSON.parse(text.replace(/^\)\]\}\'/, ''));
			items = (json[0] || [])
				.map((item: any) => {
					const label = item[0]?.replace(/\<\/?\w+\>/g, '');
					const options = item[3];
					return {
						description: options?.zi,
						icon: 'search-line',
						image: options?.zs,
						label,
					};
				})
				.filter((item: any) => {
					// filter-out calculator results (those are not searchable suggestions)
					return item.label.slice(0, 2) !== '= ';
				})
				.slice(0, 10);
			await this.cacheSuggestions.set([locals.locale, query.term], items!);
		}
		if (!result.items) {
			result.items = [];
		}
		result.items.push(...items!);
	}

	static async search(query: ISearchQuery, prevResult: ISearchResult, options: ISearchOptions, locals: App.Locals, scope: Record<string, any>): Promise<ISearchResult | void> {
		const categories = await this.getCategories(locals.locale);
		const category = options?.category || categories.web;
		const url = new URL(this.URL_SEARCH);
		const cacheKey = [locals.country, category, JSON.stringify(options?.filter || {}), query.term];
		let result = await this.cacheResults.get(cacheKey);
		if (!result) {
			const searchParams = new URLSearchParams();
			searchParams.set('q', query.term);
			searchParams.set('num', String(this.RESULTS_PER_PAGE));
			searchParams.set('hl', locals.region.split(/[\-\_]/)[0]);
			// searchParams.set('cr', `country${locals.country.toUpperCase()}`); // limits only regional websites, thus excluding wikipedia etc.
			if (locals.safeSearch) {
				searchParams.set('safe', 'active');
			}
			if (category === categories.images) {
				searchParams.set('tbm', 'isch');
			} else if (category === categories.videos) {
				searchParams.set('tbm', 'vid');
			} else if (category === categories.news) {
				searchParams.set('tbm', 'nws');
			}
			if (options?.filter) {
				searchParams.set('tbs', this.buildFilterParam(options.filter));
			}
			const resp = await request(url.toString(), searchParams, {
				cookies: this.cookies,
			});
			if (resp.status === 429) {
				if (scope.captcha || !config.puppeteer.executablePath) {
					throw new Error('Google returned 429 status code and CAPTCHA cannot be resolved.');
				}
				url.search = searchParams.toString();
				return this.openBrowser(url.toString()).then(() => {
					scope.captcha = true;
					return this.search(query, prevResult, options, locals, scope);
				});
			}
			const text = await resp.text();
			switch (category) {
				case categories.images:
					result = {
						layout: 'gallery',
						items: this.parseImages(text, categories),
					};
					break;
				case categories.news:
					result = {
						items: this.parseDefault(text, categories, url.origin, true),
					};
					break;
				default:
					result = {
						items: this.parseDefault(text, categories, url.origin),
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

	static async openBrowser(url: string) {
		const browser = await puppeteer.launch({
			headless: false,
			...config.puppeteer,
		});
		const page = await browser.newPage();
		await page.goto(url, {
			waitUntil: 'networkidle0',
		});
		return new Promise(async (resolve) => {
			page.on('domcontentloaded', async () => {
				const match = decodeURIComponent(page.url()).match(/GOOGLE_ABUSE_EXEMPTION\=([^;]+)/)
				if (match) {
					await browser.close();
					this.cookies.GOOGLE_ABUSE_EXEMPTION = match[1];
					resolve(this.cookies);
				}
			});
		});
	}

	static async loadTrending() {
		const data = await FetchData.get(this.DATA_TRENDING);
		if (data) {
			const parser = new XMLParser({
				ignoreAttributes: false,
			});
			try {
				const xml = parser.parse(data);
				const uniqueTitles: string[] = [];
				this.trending.clear();
				for (let item of xml?.rss?.channel?.item) {
					if (!uniqueTitles.includes(item.title)) {
						uniqueTitles.push(item.title);
						const newsItemArray = Array.isArray(item['ht:news_item']) ? item['ht:news_item'] : [item['ht:news_item']];
						this.trending.add({
							footer: item['ht:approx_traffic'],
							label: item.title,
							related: newsItemArray.map((newsItem: any) => {
								return {
									footer: newsItem['ht:news_item_source'],
									link: newsItem['ht:news_item_url'],
									snippet: newsItem['ht:news_item_snippet'],
									title: newsItem['ht:news_item_title'],
								};
							}),
						});
					}
				}
			} catch {
				// noop
			}
		}
	}
	
	protected static parseImages(html: string, categories: Record<string, string>) {
		const $ = cheerio.load(html);
		const items: ISearchResultItem[] = [];
		$('script').toArray().forEach((script, i) => {
			const $script = $(script);
			let text = $script.text().trim();
			if (text.includes('AF_initDataCallback')) {
				try {
					const data = JSON.parse(text.slice(text.indexOf('data:[') + 5).replace(/[^\]]+$/, ''));
					const root = data.find((item: any) => Array.isArray(item) && Array.isArray(item[0]) && item[0][0] && !Array.isArray(item[0][0]))	
					const images = root?.reduce((acc: any, item: any) => {
						return item?.find((item: any) => {
							return Array.isArray(item) && typeof item[0] === 'string' && ['GRID_STATE'].some((k) => item[0].includes(k));
						})?.[2];
					}, null as any);
					if (images) {
						 images.forEach(([ _, arr ]: any) => {
							if (Array.isArray(arr)) {
								const [ _1, id, thumb, original, _2, _3, _4, _5, _6, obj] = arr;
								const title = obj?.['2003']?.[3]?.trim();
								const link = obj?.['2003']?.[2]?.trim();
								const thumbSrc = thumb?.[0]?.trim();
								const size = original ? `${original[1]}&times;${original[2]}` : null;
								const hostname = new URL(link).hostname.replace(/^www\./, '');
								if (title && link && thumbSrc) {
									items.push({
										footer: size ? `${size} &bull; ${hostname}` : hostname,
										link,
										options: {
											original: original?.[0]?.trim()
										},
										title,
										image: thumbSrc,
									});
								}
							}
						});
					}
				} catch {
					// noop
				}
			}
		})
		return items;
	}

  protected static parseDefault(html: string, categories: Record<string, string>, origin: string, news?: boolean) {
		const $ = cheerio.load(html);
		const items: ISearchResultItem[] = [];
		const images: ISearchResultItem[] = [];
		const cards: Record<string, ISearchResultItem[]> = {};
		$('#search a').toArray().forEach((a) => {
			const $a = $(a);
			const href = $a.attr('href');
			if (href && !href.startsWith('/') && !href.includes(`/aclk?`)) {
				// filter out `/aclk` which is used for ads
				const $title = $a.find('h3, [role="heading"]').filter((_i, h) => !$(h).is('[aria-level="4"]'));	
				const title = $title.html();	
				let $snippet: cheerio.Cheerio<cheerio.Element> | undefined
				if (news) {
					$snippet = $title.nextUntil('a');
				} else if (!$snippet?.length) {
					$snippet = $a.parent().nextUntil('a');
				}
				if (!$snippet?.length) {
					$snippet = $a.parent().parent().nextUntil('a');
				}
				// video duration
				const $duration = $snippet.find('div[role="presentation"]').filter((_i, e) => !!$(e).text().match(/^(\d+\:)?\d+:\d+$/));
				let duration: string | undefined = void 0;
				if ($duration.length) {
					duration = `&#9658;&nbsp;${$duration.text()}`;
					$duration.remove();
				}
				const deeplinks = $snippet.find('a').toArray().reduce((acc, deeplink) => {
					const $deeplink = $(deeplink);
					const deephref = $deeplink.attr('href');
					const deeptext = $deeplink.text().trim();
					if (deephref && deeptext) {
						if (!deephref.startsWith('/') && !deeptext.match(/\d+\:\d+/) && !deeptext.match(/^.{0,10}\.{3}$/)) {
							// filter out video links (i.e `11:20`) and poorly truncated text
							const deeptitle = $deeplink.html();
							if (deeptitle && !acc.find((item) => item.title === deeptitle)) {
								acc.push({
									link: this.fixLink(deephref),
									title: deeptitle,
								});
							}
							const parentHasText = $deeplink.parentsUntil('div').parent().contents().filter(':not(a)').text().match(/[\w\(\)]+/);
							if (parentHasText) {
								$deeplink.replaceWith($deeplink.text());
							} else {
								$deeplink.remove();
							}
						} else {
							$deeplink.replaceWith($deeplink.text());
						}
					}
					return acc;
				}, [] as ISearchResultItemDeeplink[]);
				const snippet = this.getText($, $snippet);
				if (title && snippet) {
					const url = new URL(
						href!,
						origin,
					);
					let link = url!.searchParams.get('q');
					if (!link || !link.match(/^https?\:\/\//)) {
						link = href;
					}
					link = this.fixLink(link);
					const youtubeId = link.match(/www\.youtube\.com\/watch\?v\=([^\&\/]+)/)?.[1];
					items.push({
						deeplinks,
						labels: duration ? [duration] : void 0,
						link,
						image: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : '',
						metadata: [{
							name: 'Source',
							value: 'Google',
						}, {
							name: 'Cache',
							link: `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(link)}`,
							value: 'View cached'
						}],
						snippet,
						title,
					});
				}
			}
		});
		$('#search a.rllt__link').toArray().forEach((a) => {
			// rllt__links are displayed as cards
			// contains extra content as local businesses etc.
			const $a = $(a);
			const $heading = $a.find('.rllt__details [role="heading"]');
			const title = $heading.text();
			const snippet = this.getText($, $heading.nextAll());
			const link = $a.attr('href') || $a.next('a').attr('href');
			const parentTitle = $a.parents('div[jscontroller]').find('div[role="heading"]').first().attr('aria-label') || '';
			if (link) {
				cards[parentTitle] = cards[parentTitle] || [];
				cards[parentTitle].push({
					link: this.fixLink(link),
					snippet,
					title,
				});
			}
		});
		$('#search img[data-src]').toArray().forEach((image) => {
			const $image = $(image);
			const src = $image.attr('data-src');
			const width = $image.attr('width');
			const imgurl = $image.closest('[data-lpage]').attr('data-lpage');
			const title = imgurl ? new URL(imgurl).hostname : void 0;
			if (src && title && (!width || +width > 100)) {
				images.push({
					image: src,
					link: imgurl && this.fixLink(imgurl),
					title,
				});
			}
		});
		if (images?.length) {
			items.splice(2, 0, {
				items: images.slice(0, 5),
				link: `?category=${categories.images}`,
				title: categories.images,
				type: 'gallery',
			});
		}
		if (Object.keys(cards).length) {
			Object.keys(cards).forEach((title) => {
				items.splice(2, 0, {
					items: cards[title],
					title,
					type: 'cards',
				});
			});
		}
		return items;
	}

	protected static getText($: cheerio.CheerioAPI, $root: cheerio.Cheerio<cheerio.AnyNode>) {
		return $root.toArray().reduce((acc, el) => {
			const $el = $(el);
			const result = $el.contents().toArray().reduce((acc, n) => {
				const $n = $(n);
				let text: string;
				if (n.type === 'text') {
					text = sanitize($n.text().trim());
					if (text) {
						acc.push(text);
					}
				} else if ($n.is('a')) {
					acc.push(sanitize($n.toString()));
				} else if ($n.is('div, p, span, em')) {
					text = this.getText($, $n);
					if (text) {
						acc.push(text);
					}
				}
				return acc;
			}, [] as string[]).join(' ');
			if (result) {
				acc.push($el.is('div, p') && result ? `<div>${result}</div>` : result);
			}
			return acc;
		}, [] as string[]).join('')
			.replace(/\&lrm;|\u200E/g, '') // remove left to right marks
			.replace(/div\>\./g, 'div>') // remove lone dots
		 	.replace(/\<div\>.*\:\<\/div\>/g, '') // remove list items w/out value (wiki facts)
		 	.replace(/\<div\>.*\:\<\/div\>/g, '') // remove list items w/out value (wiki facts)
			.replace(/\<div\>\d+[\d\s\.\/\-]+\<\/div\>/g, '') // remove remaining dates (dates from deeplinks)
			.replace(/\<div\>\w+\:\([^\w]{0,}\)[^\w]?<\/div\>/g, '') // remove incomplete list items (deeplinks)
			.replace(/\s([\.\,\;])/g, '$1') // fix spacing
			.replace(/\<div\>[^\w]+\<\/div\>/g, '') // remove non-word lines
			.replace(/\s?[⋅·]\s?/g, '&nbsp;&bull;&nbsp;') // replace varying bullet points
			.replace(/\<div\>\<\/div\>/g, ''); // remove empty divs
	}

	protected static fixLink(link: string) {
		if (!link.startsWith('https://')) {
			// google links to non-secure links even for top websites, force https
			link = link.replace(/^http\:\/\//, 'https://');
		}
		return link;
	}

	protected static buildFilterParam(filter: Record<string, string>) {
		return Object.keys(filter).reduce((acc, key) => {
			switch (key) {
				case 'color':
					return [...acc, `ic:${filter[key]}`];
				case 'length':
					return [...acc, `dur:${filter[key]}`];
				case 'size':
					return [...acc, `isz:${filter[key]}`];
				case 'sort':
					return [...acc, `sbd:${filter[key]}`];
				case 'time':
					return [...acc, `qdr:${filter[key]}`];
				case 'type':
					return [...acc, `itp:${filter[key]}`];
				default:
					// noop
			}
			return acc;
		}, [] as string[]).join(',');
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
				label: t('label.large'),
				value: 'l',
			}, {
				label: t('label.medium'),
				value: 'm',
			}, {
				label: t('label.icon'),
				value: 'i',
			}],
		}, {
			label: t('label.color'),
			name: 'color',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.monochrome'),
				value: 'gray',
			}, {
				label: t('label.transparent'),
				value: 'trans',
			}, {
				label: t('label.red'),
				value: 'specific,isc:red',
			}, {
				label: t('label.orange'),
				value: 'specific,isc:orange',
			}, {
				label: t('label.yellow'),
				value: 'specific,isc:yellow',
			}, {
				label: t('label.green'),
				value: 'specific,isc:green',
			}, {
				label: t('label.teal'),
				value: 'specific,isc:teal',
			}, {
				label: t('label.blue'),
				value: 'specific,isc:blue',
			}, {
				label: t('label.purple'),
				value: 'specific,isc:purple',
			}, {
				label: t('label.pink'),
				value: 'specific,isc:pink',
			}, {
				label: t('label.white'),
				value: 'specific,isc:white',
			}, {
				label: t('label.gray'),
				value: 'specific,isc:gray',
			}, {
				label: t('label.black'),
				value: 'specific,isc:black',
			}, {
				label: t('label.brown'),
				value: 'specific,isc:brown',
			}],
		}, {
			label: t('label.type'),
			name: 'type',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.clipart'),
				value: 'clipart',
			}, {
				label: t('label.line_drawing'),
				value: 'lineart',
			}, {
				label: t('label.gif'),
				value: 'animated',
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
			name: 'time',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_hour'),
				value: 'h',
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
		}, {
			label: t('label.sort'),
			name: 'sort',
			options: [{
				label: t('label.relevance'),
				value: '',
			}, {
				label: t('label.date'),
				value: '1',
			}],
		}];
	}

	protected static async getVideosFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'time',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_hour'),
				value: 'h',
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
		}, {
			label: t('label.length'),
			name: 'length',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.short'),
				value: 's',
			}, {
				label: t('label.medium'),
				value: 'm',
			}, {
				label: t('label.long'),
				value: 'l',
			}],
		}];
	}

	protected static async getWebFilters(locale: string) {
		const t = await i18n(locale);
		return [{
			label: t('label.time'),
			name: 'time',
			options: [{
				label: t('label.any'),
				value: '',
			}, {
				label: t('label.past_hour'),
				value: 'h',
			}, {
				label: t('label.past_24_hour'),
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
}
