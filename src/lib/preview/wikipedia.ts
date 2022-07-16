import { Preview } from '$lib/preview';
import { ImplementsStatic, type IPreviewProvider } from '$lib/types';

@ImplementsStatic<IPreviewProvider>()
export class Wikipedia {
	static match = new RegExp(`https://[^\/]+\.wikipedia\.org/wiki/(?!(Special|Wikipedia|Portal)\:)`);

	static async preview(url: string, locals: App.Locals) {
		const body = await Preview.request(url);
		const anchor = url.match(/\#([^\?]+)/)?.[1];
		const { $, sections } = Preview.parseHTML(body, url, {
			headings: anchor ? `h2 > #${anchor}, h3 > #${anchor}` : 'h1',
			snippets: 'h3, h4, h5, p, ul, ol, pre',
			maxSections: 1,
			maxSnippets: 3,
			ignore: '.ambox, .infobox, .nomobile, .sidebar, .toc',
			root: ($) => {
				$('.mw-editsection').remove(); // remove [edit] links
				$('sup > a').parent().remove(); // remove foot note links
				$('#coordinates').remove(); // remove geo coordinates
				return $.root();
			},
			stops: 'h1, h2',
		});
		const image = $('.thumb, .infobox, .sidebar, .vcard').find('img').filter((i, el) => {
			const width = parseInt($(el).attr('width') || '0', 10);
			return !width || width > 100;
		}).first().attr('src');
		const geohack = $('#coordinates a.external').attr('href');
		return {
			icon: '/favicons/wikipedia.svg',
			footer: `<div class="mt-3 small">Source: <a href="${url}">wikipedia.org</a>. CC BY-SA 3.0.</div>`,
			link: url,
			image,
			deeplinks: geohack ? [{
				icon: 'map-pin-line',
				link: encodeURIComponent(geohack),
			}] : void 0,
			html: sections[0]?.snippet,
			title: sections[0]?.title,
		};
	}
}
