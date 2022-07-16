import type { RequestEvent } from '@sveltejs/kit';
import { writable, type Writable } from 'svelte/store';
import type { z } from 'zod';
import extend from 'just-extend';
import { AlreadyExistsError, ApiError, NotFoundError, ValidationError } from '$lib/errors';
import type { IRequestOptions } from '$lib/types';

const injectScriptPromises = new Map<string, Promise<unknown>>();

export function debounce(fn: (...args: any[]) => void, delay: number) {
	let timeout: NodeJS.Timeout;
	return (...args: any[]) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			fn(...args);
		}, delay);
	};
}

export function throttle(fn: (...args: any[]) => void, delay: number) {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: any[]) => {
		if (!timeout) {
			fn(...args);
			timeout = setTimeout(() => {
				timeout = null;
			}, delay);
		}
	}
}

export function createAsyncHandle<T>(fn: () => Promise<T>, run: boolean = true) {
	const w = writable<{ error: null | string, data: null | T, loading: boolean }>({
		data: null,
		error: null,
		loading: true,
	});
	const fetchData = () => {
		return fn().then((data) => {
			w.set({
				data,
				error: null,
				loading: false,
			});
			return data;
		}).catch((err) => {
			w.set({
				data: null,
				error: String(err.message || err),
				loading: false,
			});
			throw err;
		});
	};
	if (run) {
		fetchData();
	}
	// @ts-ignore
	w.fetch = () => fetchData();
	return w as Writable<any> & { fetch: () => Promise<T> };
}

export async function readRequestBody(request: RequestEvent['request']) {
	const contentType = request.headers.get('content-type')?.split(';').shift();
	switch (contentType) {
		case 'application/x-www-form-urlencoded':
		case 'multipart/form-data':
			const formData = await request.formData();
			// @ts-ignore
			return Object.fromEntries(formData.entries());
		case 'application/json':
			return request.json();
		default:
			return null;
	}
}

export function errorToJSON(err: any) {
	return {
		name: err?.name,
		message: err?.message || String(err),
		details: err?.details,
	}
}

export function handleRequest<TData = unknown>(fn: (ev: RequestEvent, data: TData, isHXR: boolean) => Promise<{ status?: number, body?: any, headers?: Record<string, string>}>, options?: { input?: z.ZodObject<any>, readBody?: boolean }) {
	return async (ev: RequestEvent): Promise<{ status?: number, body?: any, headers?: Record<string, string>}> => {
		const isXHR = ev.request.headers.get('sec-fetch-mode') === 'cors';
		let data = options?.readBody !== false ? await readRequestBody(ev.request) : null;
		let result;
		try {
			// data validation
			if (options?.input?.parse) {
				try {
					data = options.input.parse(data);
				} catch (err) {
					// @ts-ignore
					throw new ValidationError(err?.issues);
				}
			}

			// call the main function
			result = await fn(ev, data, isXHR);
		} catch (err: any) {
			console.log(err)
			if (isXHR) {
				// return JSON for XHR/fetch requests
				return {
					status: err?.status || 500,
					body: {
						error: errorToJSON(err),
					},
				};
			}

			// redirect with ?error={...} when POSTed
			return {
				status: 303,
				headers: {
					location: `${(ev.request.headers.get('referer') || '/')}?error=${JSON.stringify(errorToJSON(err))}`,
				},
				body: {
					error: errorToJSON(err),
				},
			}
		}

		return result;
	}
}

export async function injectScript(src: string) {
	if (injectScriptPromises.has(src)) {
		return injectScriptPromises.get(src);
	}
	const el = document.querySelector(`script[src="${src}"]`);
	if (el) {
		return true;
	}
	injectScriptPromises.set(src, new Promise((resolve, reject) => {
		const el = document.createElement('script');
		el.addEventListener('error', (err) => {
			reject(err);
		});
		el.addEventListener('load', () => {
			resolve(true);
		});
		el.src = src;
		el.async = true;
		document.body.appendChild(el);
	}));
	return injectScriptPromises.get(src);
}

export async function copyToClipboard(text: string) {
	if ('clipboard' in navigator) {
		await navigator.clipboard.writeText(text);
		return true;
	}
	return false;
}

export function createCookie(name: string, value: string, ttl?: number, path?: string) {
	const flags: Record<string, string> = {
		SameSite: 'Strict',
	};
	if (path) {
		flags['path'] = path;
	}
	if (ttl) {
		flags['expires'] = new Date(Date.now() + ttl).toUTCString();
	}
	return `${name}=${value}; ${Object.keys(flags).map((key) => `${key}=${flags[key]}`).join('; ')}`;
}

export function setCookie(name: string, value: string, ttl?: number, path?: string) {
	document.cookie = createCookie(name, value, ttl, path);
}

export async function request(options: IRequestOptions) {
	options = extend(true, {
		headers: {
			'Cookie': options.cookies ? Object.entries(options.cookies).map(([ name, value ]) => `${name}=${value}`).join('; ') : void 0,
			'User-Agent': `privian/${process.env.package_version}`,
		},
		method: 'GET',
		timeout: 10000,
	}, options) as IRequestOptions;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), options.timeout);
	const url = new URL(options.url);
	if (options.searchParams instanceof URLSearchParams) {
		url.search = options.searchParams.toString();

	} else if (options.searchParams) {
		for (let key in options.searchParams) {
			url.searchParams.set(key, String(options.searchParams[key]));
		}
	}
	let body: any = void 0;
	if (options.body && options.method !== 'GET') {
		body = options.body;
		if (typeof body === 'object' && (!options.headers!['Content-Type'] || options.headers!['Content-Type'].includes('application/json'))) {
			if (!options.headers!['Content-Type']) {
				options.headers!['Content-Type'] = 'application/json';
			}
			body = JSON.stringify(body);
		}
	}
	const resp = await fetch(url, {
		body,
		credentials: 'omit',
		headers: Object.fromEntries(Object.entries(options.headers!).filter(([ name, value ]) => !!name && !!value)) as Record<string, string>,
		method: options.method,
		keepalive: true,
		signal: controller.signal,
	});
	clearTimeout(timeout);
	if (options.validateStatus !== false && resp.status > 204) {
		await throwResponseError(resp);
	}
	return resp;
}

export async function readResponseBody(response: Response) {
	if (response.status === 204) {
		return null;
	}	
	let body: unknown = null;
	try {
		if (response.headers.get('content-type')?.includes('application/json')) {
			body = await response.json();	
		} else {
			body = await response.text();
		}
	} catch (err: any) {
		throw new Error(`Unable to read response body (${response.status}): ${err.message}`);
	}
	return body;
}

export async function throwResponseError(response: Response) {
	let body: any = null;
	try {
		body = await readResponseBody(response);
	} catch (err) {
		// noop
	}
	switch (response.status) {
		case 404:
			throw new NotFoundError(body?.message);
		case 409:
			throw new AlreadyExistsError(body?.message);
		default:
			throw new ApiError(body?.message || `Request failed with status ${response.status}`);
	}
}
