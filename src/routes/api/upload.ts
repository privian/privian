import type { RequestEvent } from '@sveltejs/kit';
import { handleRequest } from '$lib/helpers';
import { Api } from '$lib/api';
import { BadRequestError } from '$lib/errors';

// export const post = async ({ locals, request }: RequestEvent) => {
export const post = handleRequest(async ({ locals, request }, data) => {
	const api = Api.getUploadApi();
	if (!api) {
		throw new BadRequestError(`Unable to detect any API with uploadUrl.`);
	}
	const resp = await api.request({
		body: await request.blob(),
		headers: {
			'Content-Type': request.headers.get('content-type')!,
		},
		method: 'POST',
		url: '/upload',
	}, locals);
	const body = await resp.json();
	return {
		body: {
			url: new URL(body.url, api.url).toString(),
		},
		status: resp.status,
	};
}, {
	readBody: false,
});
