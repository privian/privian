import { Preview } from '$lib/preview';
import { ImplementsStatic, type IPreviewProvider } from '$lib/types';

@ImplementsStatic<IPreviewProvider>()
export class Mdn {
	static match = new RegExp(`https://developer\.mozilla\.org/[^\/]+/docs/`);

	static async preview(url: string) {
		const anchor = url.match(/\#([^\?]+)/)?.[1];
		const body = await Preview.request(url);
		const { sections } = Preview.parseHTML(body, url, {
			before: ($, $root) => {
				$root.find('pre').each((_i, el) => {
					const $el = $(el);
					const lang = $el.attr('class')?.match(/\b(js|html|css)\b/)?.[1];
					if (lang) {
						$el.find('code').addClass(`language-${lang}`);
					}
				});
			},
			headings: anchor ? `#${anchor}` : 'h1',
			ignore: '.metadata, .prev-next, #specifications, #browser_compatibility',
			maxSections: 200,
			maxSnippets: 200,
			root: ($) => $('#content'), 
			snippets: 'h2, h3, h4, h5, h6, p, ul, ol, dl, pre, table',
			stops: '',
		})
		return {
			link: url,
			icon: '/favicons/mdn.svg',
			footer: `Source: <a href="${url}">developer.mozilla.org</a>. CC-BY-SA.`,
			html: sections.map((section) => section.snippet).join(''),
			title: sections[0]?.title,
		};
	}
}
