import { parse as parseCookie } from 'cookie';
import { parseAcceptLanguage } from 'intl-parse-accept-language';
import JWT from 'jsonwebtoken';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, GetSession } from '@sveltejs/kit';
import config from '$lib/config';
import { Api } from '$lib/api';
import { Providers } from '$lib/providers';

const auth: Handle = async ({ event, resolve }) => {
	const cookies = parseCookie(event.request.headers.get('cookie') || '');
	const locales = parseAcceptLanguage(event.request.headers.get('accept-language') || '');
	const locale = cookies.language || locales[0];
	const region = cookies.region || locales[0];

	event.locals.multitenant = false;
	event.locals.locale = locale;
	event.locals.region = region;
	event.locals.country = region?.split(/[\-\_]/)?.pop()!;
	event.locals.safeSearch = cookies.safe_search === 'true';

	if (config.jwt?.cookieName && cookies[config.jwt?.cookieName]) {
		const decoded = JWT.verify(cookies[config.jwt?.cookieName], config.jwt.secret) as JWT.JwtPayload;
		if (decoded) {
			event.locals.jwt = cookies[config.jwt?.cookieName];
			event.locals.user = {
				avatar: decoded.avatar,
				id: decoded.sub!,
				name: decoded.name,
				org: decoded.org,
				role: decoded.role,
			};
			return resolve(event);
		}
	}

	event.locals.jwt = null;
	event.locals.user = null;
	return resolve(event);
};

export const handle = sequence(auth);

export const getSession: GetSession = (event) => {
	return {
		multitenant: !!event?.locals?.multitenant,
		user: event?.locals?.user || null,
	};
}

Api.load();

Providers.load().catch((err) => {
	console.log('Error loading providers: ', err);
});