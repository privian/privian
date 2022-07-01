import path from 'path';
import * as cheerio from 'cheerio';
import * as entities from 'entities';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index.js';
import duration from 'parse-duration';
import config from '$lib/config';
import { Cache } from '$lib/cache';
import { sanitizeDeep } from '$lib/sanitizer';
import * as previewProviders from '$lib/preview/';
import type { IPreviewProvider, IPreviewResult } from '$lib/types';

loadLanguages([
	'html',
	'python',
]);

export interface IPreviewParseOptions {
	before?: ($: cheerio.CheerioAPI, $root: cheerio.Cheerio<cheerio.AnyNode>) => void,
	root?: ($: cheerio.CheerioAPI) => cheerio.Cheerio<cheerio.AnyNode>,
	headings: string;
	maxSections: number;
	maxSnippets: number;
	snippets: string;
	stops: string;
	ignore: string;
}

export class Preview {
	static readonly providers: Set<IPreviewProvider>= new Set();

	static readonly cache = new Cache<IPreviewResult>({
		redis: {
			prefixKey: 'preview:',
		},
		lru: {
			max: 100,
		},
		ttl: duration('2h'),
	});

	static defaultRequestOptions() {
		return {
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36',
			timeout: 5000,
		};
	}

	static defaultParseOptions() {
		return {
			headings: 'h1, h2, h3, h4, h5, h6',
			maxSections: 10,
			maxSnippets: 3,
			snippets: 'p, ul, ol, pre',
			stops: 'h1, h2, h3, h4, h5, h6, hr',
			ignore: '',
		};
	}


	static register(provider: IPreviewProvider) {
		this.providers.add(provider);
	}

	static createRegExp(match: string) {
		return new RegExp(match);
	}

	static getProvider(url: string) {
		for (let provider of this.providers) {
			if (provider.match.test(url)) {
				return provider;
			}
		}
	}

	static canPreview(url: string) {
		return !!this.getProvider(url);
	}

	static async preview(url: string, locals: App.Locals): Promise<IPreviewResult | undefined> {
		const provider = this.getProvider(url);
		if (provider) {
			let result = await this.cache.get(url);
			if (!result) {
				result = sanitizeDeep<IPreviewResult>(await provider.preview(url, locals));
				await this.cache.set(url, result);
			}
			return result;
		}
	}

	static async request(url: string, options?: any) {
		options = Object.assign(this.defaultRequestOptions(), options);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), options.timeout);
		const resp = await fetch(url, {
			headers: {
				'User-Agent': options.userAgent,
			},
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (resp.status !== 200) {
			throw new Error(`Invalid response code ${resp.status}`);
		}
		return resp.text();
	}

	static parseHTML(html: string, baseUrl: string, userOptions: Partial<IPreviewParseOptions> = {}) {
		const options: IPreviewParseOptions = Object.assign(this.defaultParseOptions(), userOptions);
		const $ = cheerio.load(html);
		const $root = options.root ? options.root($) : $.root();
		if (options.before) {
			options.before($, $root);
		}
		const els = $root.find([options.headings, options.snippets, options.stops].filter((sel) => !!sel).join(', ')).toArray();
		const sections: any[] = [];
		let skip = false;
		for (let el of els) {
			const $el = $(el);
			if (options.ignore && $el.closest(options.ignore).length) {
				continue;
			}
			if ($el.is(options.headings)) {
				const title = $el.text().trim();
				if (sections.length >= options.maxSections) {
					break;
				}
				if (title) {
					skip = false;
					sections.push({
						title,
						snippets: [],
					});
				}
			} else if ($el.is(options.stops)) {
				skip = true;

			} else if (!skip && sections[sections.length - 1]?.snippets.length < options.maxSnippets) {
				const text = $el.text().trim();
				if (text) {
					sections[sections.length - 1]?.snippets.push(this.cleanup($, $el, baseUrl));	
				}
			}
		}
		return {
			$,
			sections: sections.map((section) => {
				return {
					title: entities.encodeHTML(section.title),
					snippet: section.snippets.join(''),
				};
			}),
		};
	}

	static cleanup($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.AnyNode>, baseUrl: string): string {
		const parsedUrl = new URL(baseUrl);
		const origin = parsedUrl.origin;
		const baseName = path.basename(baseUrl);
		const basePath = parsedUrl.pathname.slice(1, parsedUrl.pathname.length - baseName.length - 1);
		if ($el.is('h1, h2, h3, h4, h5, h6')) {
			return this.cleanupHeadings($el);
		}
		if ($el.is('pre')) {
			return this.cleanupPre($el);
		}
		$el.find('h1, h2, h3, h4, h5, h6').each((_i, el) => {
			$(el).replaceWith(this.cleanupHeadings($(el)));
		});
		$el.find('pre').each((_i, pre) => {
			$(pre).replaceWith(this.cleanupPre($(pre)));
		});
		$el.find('a').each((_i, a) => {
			const $a = $(a);
			const href = $a.attr('href');
			if (href && !href?.match(/^(https?\:)?\/\//)) {
				if (href[0] === '/') {
					$a.attr('href', origin + '/' + href.slice(1));
				} else if (href[0] === '#') {
					$a.replaceWith($a.text());
				} else {
					$a.attr('href', origin + '/' + basePath + '/' + href);
				}
			}
		});
		return $el.toString();
	}

	static cleanupHeadings($el: cheerio.Cheerio<cheerio.AnyNode>) {
		const $a = $el.find('a');
		return `<div class="font-bold">${$a.length ? $a.html() : $el.html()}</div>`;
	}

	static cleanupPre($el: cheerio.Cheerio<cheerio.AnyNode>) {
		const $code = $el.find('code');
		let lang = $code.attr('class')?.match(/language\-(\w+)/)?.[1] || 'clike';
		if (!Prism.languages[lang]) {
			lang = 'clike';
		}
		return `<pre><code class="language-${lang}">${Prism.highlight($el.text(), Prism.languages[lang], lang)}</code></pre>`;
	}
}

if (config.providers?.preview) {
	for (let provider of config.providers.preview) {
		// @ts-ignore
		if (previewProviders[provider]) {
			// @ts-ignore
			Preview.register(previewProviders[provider]);
		}
	}
}
