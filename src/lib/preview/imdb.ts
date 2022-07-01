import { Preview } from '$lib/preview';
import { ImplementsStatic, type IPreviewProvider } from '$lib/types';

@ImplementsStatic<IPreviewProvider>()
export class Imdb {
	static match = new RegExp(`https://www\.imdb\.com/title/[^\/]+/?$`);
	
	static async preview(url: string) {
		const body = await Preview.request(url);
		const { $, sections } = Preview.parseHTML(body, url, {
			headings: 'h1:first',
			snippets: '[data-testid="plot"] span[data-testid="plot-xl"]',
		});
		const genres = $('div[data-testid="genres"] .ipc-chip').toArray().map((el) => $(el).text());
		const image = $('.ipc-poster__poster-image img').attr('src');
		const rating = $('div[data-testid="hero-rating-bar__aggregate-rating__score"]:first').text().replace('/', '&nbsp;/&nbsp;');
		const info = $('ul[data-testid="hero-title-block__metadata"] li').toArray().map((el) => {
			const $el = $(el);
			const $a = $el.find('a');
			return [
				$a.length ? $a.text() : $el.text(),
			];
		});
		const metadata = $('.ipc-metadata-list:first .ipc-metadata-list__item').toArray().map((el) => {
			const $el = $(el);
			return [
				$el.find('.ipc-metadata-list-item__label').text(),
				Preview.cleanup($, $el.find('.ipc-metadata-list-item__content-container'), url),
			];
		}).filter(([ label, content ]) => !!label && !!content).slice(0, 6);

		const html = `
			<p>${genres.map((genre) => `<span class="badge badge-outline">${genre}</span>`).join(' ')}</p>
			<p>${sections[0]?.snippet}</p>
			<div>${metadata.map(([ l, c ]) => `<h4>${l}</h4><div>${c}</div>`).join('')}</div>
		`;

		return {
			icon: '/favicons/imdb.svg',
			footer: `<div class="mt-3 small">Source: <a href="${url}">imdb.com</a>.</div>`,
			image,
			link: url,
			html,
			title: sections[0]?.title,
			subtitle: [rating, ...info].join('&nbsp;&bull;&nbsp;'),
		};
	}
}
