import { get } from 'svelte/store';
import { addMessages, getLocaleFromNavigator, init, waitLocale, t, register, locale } from 'svelte-i18n';

import en from './i18n/en.json';

addMessages('en', en);

// register('de-DE', () => import('./i18n/de.json'));

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),

});

export async function i18n(l: string): Promise<(key: string, params?: any) => string> {
  if (get(locale) !== l) {
    await waitLocale(l);
    locale.set(l);
  }
  return get(t);
} 