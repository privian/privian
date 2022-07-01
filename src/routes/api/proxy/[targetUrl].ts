import { handleRequest } from '$lib/helpers';

export const get = handleRequest(async ({ locals, params, url }, data) => {
	let targetUrl = decodeURIComponent(params.targetUrl);
	if (targetUrl.startsWith('//')) {
		targetUrl = `https:${targetUrl}`;
	}
	const resp = await fetch(targetUrl, {
		credentials: 'omit',
		headers: {
			'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36`,
		},
		keepalive: true,
	});
	const allowedHeaders = [
		'cache-control',
		'expires',
	];
	const headers: Record<string, string> = {};
	for (let header of allowedHeaders) {
		if (resp.headers.has(header)) {
			headers[header] = resp.headers.get(header)!;
		}
	}
	// node adapter has some problems with streams, use buffer for now; fix later
	const blob = await resp.blob();
  return {
		body: Buffer.from(await blob.arrayBuffer()),
		headers,
		status: resp.status,
  };
});
