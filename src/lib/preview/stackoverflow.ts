import { Preview } from '$lib/preview';
import { ImplementsStatic, type IPreviewProvider } from '$lib/types';

@ImplementsStatic<IPreviewProvider>()
export class StackOverflow {
	static match = new RegExp(`https://stackoverflow\.com/questions/\\d+`);

	static async preview(url: string) {
		const body = await Preview.request(url);
		let language: string;
		const { $, sections } = Preview.parseHTML(body, url, {
			before: ($) => {
				language = $('a[rel="tag"]:first').text();
				if (language) {
					$('code').each((_i, code) => {
						const $code = $(code);
						if (!$code.attr('class')?.includes('language-')) {
							$code.addClass(`language-${language}`);
						}
					});
				}
			},
			headings: 'h1:first',
			maxSections: 1,
			maxSnippets: 10,
			snippets: '.answer:first .js-post-body',
			stops: '',
		});
		const author = $('.answercell:first div[itemprop="author"] span[itemprop="name"]').text();
		const question = Preview.cleanup($, $('.postcell:first .js-post-body'), url);
		const html = question || sections[0]?.snippet ? `<details class="mb-3"><summary>Question</summary><div class="border rounded bg-base-200 px-4 py-2">${question}</div></details>${sections[0]?.snippet || '<p><em>No answer.</em></p>'}` : void 0;
		return {
			footer: `Source: <a href="${url}">stackoverflow.com</a>. Aswered by ${author}. CC-BY-SA.`,
			icon: '/favicons/stackoverflow.svg',
			link: url,
			html,
			title: sections[0]?.title,
		};
	}
}
