import { get, writable, type Writable } from 'svelte/store';
import { getLocaleFromNavigator, locales } from 'svelte-i18n';
import { browser } from '$app/env';
import { setCookie } from '$lib/helpers';
import type { ISearchResultItem, ISearchSuggestionsResult, ILightroom } from '$lib/types';

const COOKIE_TTL = 86400000 * 365;

function persistentWritable<T>(key: string, initial: any, onChange?: (value: T) => void) {
	const { subscribe, set } = writable<T>(initial);
	if (browser) {
		const json = localStorage.getItem(key);
		if (json) {
			set(JSON.parse(json));
		}
	}
	subscribe(value => {
		if (browser) {
			localStorage.setItem(key, JSON.stringify(value));
			if (onChange) {
				onChange(value);
			}
		}
	});
  return {
    subscribe,
    set,
  };
}

const navigatorLanguage = getLocaleFromNavigator();
const defaultLanguage = get(locales).includes(navigatorLanguage!) ? navigatorLanguage : 'en';

export const actionId = writable<string | null>(null);
export const actionParams = writable<Record<string, string> | null>(null);
export const actionView = writable<any>(null);
export const confirm = writable<string | null>(null);
export const info = writable<ISearchResultItem | null>(null);
export const language = persistentWritable<string>('language', defaultLanguage, (value) => setCookie('language', value, COOKIE_TTL));
export const lightroom = writable<ILightroom | null>(null);
export const scrolled = writable<boolean>(false);
export const previewItem = writable<ISearchResultItem | null>(null);
export const previewLoading = writable<boolean>(false);
export const previewModalEnabled = persistentWritable<boolean>('previewModalEnabled', false);
export const prompt = writable<any>(null);
export const region = persistentWritable<string>('region', navigatorLanguage, (value) => setCookie('region', value, COOKIE_TTL));
export const theme = persistentWritable<string>('theme', 'privian');
export const toast = writable<any>(null);
export const trending = writable<ISearchSuggestionsResult | null>(null);
export const safeSearchEnabled = persistentWritable<boolean>('safe_search', true, (value) => setCookie('safe_search', String(value), COOKIE_TTL));
export const searchHistory = persistentWritable<string[]>('search_history', []);
export const searchHistoryEnabled = persistentWritable<boolean>('search_history_enabled', true);
