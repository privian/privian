import sanitizeHtml from 'sanitize-html';

const TAG_REG_EXP = /\<\w+[^\>]{0,}\>/;

export function sanitizeDeep<T>(obj: T): T {
	return Object.keys(obj).reduce((acc: any, key) => {
		switch (typeof acc[key]) {
			case 'string':
				if (acc[key].match(TAG_REG_EXP)) {
					acc[key] = sanitize(acc[key]).trim();
				}
				break;
			case 'object':
				if (acc[key]) {
					acc[key] = sanitizeDeep(acc[key]);
				}
				break;
			default:
				// noop
		}
		acc[key]
		return acc;
	}, obj);
}

export function sanitize(html: string) {
	return sanitizeHtml(html, {
		allowedTags: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'br',
			'b',
			'i',
			'em',
			'strong',
			'a',
			'div',
			'p',
			'pre',
			'code',
			'ul',
			'ol',
			'li',
			'table',
			'tr',
			'td',
			'th',
			'dl',
			'dt',
			'dd',
			'span',
			'section',
			'article',
			'details',
			'summary',
		],
		allowedAttributes: {
			'*': ['class'],
			'a': ['href'],
		},
	});
}