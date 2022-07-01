import type { RequestEvent } from '@sveltejs/kit';
import { writable, type Writable } from 'svelte/store';
import type { z } from 'zod';
import { serialize } from 'cookie';
import { ValidationError } from '$lib/api/errors';

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

export function handleRequest<TData = unknown>(fn: (ev: RequestEvent, data: TData, isHXR: boolean) => Promise<{ status?: number, body?: any, headers?: Record<string, string>}>, input?: z.ZodObject<any>) {
	return async (ev: RequestEvent): Promise<{ status?: number, body?: any, headers?: Record<string, string>}> => {
		const isXHR = ev.request.headers.get('sec-fetch-mode') === 'cors';
		let data = await readRequestBody(ev.request);
		let result;
		try {
			// data validation
			if (input?.parse) {
				try {
					data = input.parse(data);
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

export async function request(url: string, data?: unknown, options?: { method?: string, cookies?: Record<string, string>, headers?: Record<string, string>, userAgent?: string, timeout?: number }): Promise<Response> {
	options = Object.assign({
		method: 'GET',
		timeout: 10000,
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36',
	}, options);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), options.timeout);
	const headers: Record<string, string | undefined> = {
		'Cookie': options.cookies ? Object.entries(options.cookies).map(([ name, value ]) => `${name}=${value}`).join('; ') : void 0,
		'User-Agent': options.userAgent!,
		...options.headers,
	};
	if (options.method !== 'GET' && data) {
		headers['Content-Type'] = 'application/json';
	}
	if (options.method === 'GET' && data && typeof data === 'object') {
		const urlObject = new URL(url);
		if (data instanceof URLSearchParams) {
			urlObject.search = data.toString();

		} else if (typeof data === 'object') {
			for (let key in data) {
				// @ts-ignore
				urlObject.searchParams.set(key, String(data[key]));
			}
		}
		url = urlObject.toString();
	}
	const resp = await fetch(url, {
		body: options.method !== 'GET' && data ? JSON.stringify(data) : void 0,
		credentials: 'omit',
		headers: Object.fromEntries(Object.entries(headers).filter(([ name, value ]) => !!name && !!value)) as Record<string, string>,
		keepalive: true,
		signal: controller.signal,
	});
	clearTimeout(timeout);
	if (resp.status > 204) {
		// throw new Error(`Request failed with status ${resp.status}`);
	}
	return resp;
}
