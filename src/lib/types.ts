export type PartialNested<T> = {
	[P in keyof T]?: PartialNested<T[P]>;
};

export function ImplementsStatic<T>() {
	return <U extends T>(constructor: U) => {constructor};
}

export interface ISearchProvider {
	new(): {};
	load(): Promise<void>;
	search(query: ISearchQuery, result: ISearchResult, options: ISearchOptions, locals: App.Locals, scope: Record<string, any>): Promise<ISearchResult | void>;
	suggest(query: ISearchQuery, result: ISearchResult, options: ISearchOptions, locals: App.Locals, scope: Record<string, any>): Promise<ISearchSuggestionsResult | void>;
	publicMethod(method: string, searchParams: URLSearchParams): Promise<any>;
}

export interface IPreviewProvider {
	new(): {};
	match: RegExp;
	preview(url: string, locals: App.Locals): Promise<IPreviewResult>;
}

export interface IBangOptions {
	label: string;
	priority: number;
	url: string;
}

export interface IConfigJwt {
	cookieName: string;
	secret: string;
}

export interface IConfigBangs {
	add?: Record<string, IBangOptions>;
	blacklist?: string[];
	enable?: boolean;
	whitelist?: string[];
}

export interface IConfigProviders {
	disable?: string[];
	preview?: false | string[];
	search?: string[];
	suggestions?: false | string[];
}

export interface IConfigApi {
	name: string;
	url: string;
}

export interface IConfigRedisCache {
	brotli: boolean;
	hashKey: boolean;
}

export interface IConfigRedis {
	cache: IConfigRedisCache;
	url: string;
}

export interface IConfigPuppeteer {
	executablePath: string;
}

export interface IConfig {
	apis: IConfigApi[];
	bangs: IConfigBangs;
	jwt: IConfigJwt;
	providers: IConfigProviders;
	puppeteer: IConfigPuppeteer;
	redis: IConfigRedis;
}

export interface ISearchOptions {
	category?: string;
	filter?: Record<string, string>;
	locale?: string;
}

export interface ISearchResultItemAction {
	icon?: string;
	id: string;
	label: string;
	parameters?: Record<string, string>;
	tooltip?: string;
}

export interface ISearchResultItemMetadata {
	name: string;
	link?: string;
	value: string;
}

export interface ISearchResultItemDeeplink {
	title: string;
	link: string;
	preview?: boolean;
	snippet?: string;
}

export interface ISearchResultItem<TOptions  = Record<string, any>> {
	actions?: ISearchResultItemAction[];
	crawledAt?: number;
	deeplinks?: ISearchResultItemDeeplink[];
	safe?: boolean;
	footer?: string;
	icon?: string;
	id?: string;
	image?: string;
	items?: ISearchResultItem[];
	labels?: string[];
	language?: string;
	link?: string;
	metadata?: ISearchResultItemMetadata[];
	options?: TOptions;
	preview?: boolean;
	privacyScore?: number;
	source?: string;
	snippet?: string;
	subtitle?: string;
	timestamp?: number;
	title?: string;
	type?: string;
}

export interface ISearchResultFilterOption {
	label: string;
	value: string;
}

export interface ISearchResultFilter {
	label: string;
	name: string;
	options: ISearchResultFilterOption[];
}

export interface ISearchResult {
	categories?: string[];
	category?: string;
	filters?: ISearchResultFilter[];
	icon?: string;
	items?: ISearchResultItem[];
	layout?: string;
	name?: string;
	notice?: string;
	preview?: IPreviewResult;
	redirect?: string;
}

export interface ISearchSuggestionsResultItem {
	aside?: string;
	bang?: string;
	command?: string;
	description?: string;
	icon?: string;
	image?: string;
	label: string;
}

export interface ISearchSuggestionsResult {
	notice?: string;
	items?: ISearchSuggestionsResultItem[];
}

export interface IAction {
	api: string;
	id: string;
	method?: string;
	viewUrl?: string;
	url?: string;
}

export interface IActionViewPrompt {
	text: string;
	title?: string;
}

export interface IActionView {
	actions?: ISearchResultItemAction[];
	form?: IForm;
	id: string;
	html?: string;
	parameters?: Record<string, string>;
	prompt?: IActionViewPrompt;
	subtitle?: string;
	title?: string;
}

export interface IToast {
	text?: string;
	title?: string;
	type?: string;
}

export interface IActionResult {
	toast?: IToast;
}

export interface ICommand {
	api: string;
	description?: string;
	id: string;
	method?: string;
	url: string;
}

export interface ISearchQuery {
	command: string | null;
	bang: string | null;
	term: string;
}

export interface IPreviewResultDeeplink {
	icon?: string;
	label?: string;
	link: string;
}

export interface IPreviewResult {
	category?: string;
	footer?: string;
	icon?: string;
	image?: string;
	link: string;
	deeplinks?: IPreviewResultDeeplink[];
	html?: string;
	title?: string;
	subtitle?: string;
}

export interface ILightroom {
	el?: HTMLElement;
	footer?: string;
	link?: string;
	src: string;
	srcOriginal?: string;
	title?: string;
}

export interface ITrendingItemRelated {
	footer?: string;
	title: string;
	link: string;
	snippet?: string;
}

export interface ITrendingItem {
	footer?: string;
	label: string;
	related?: ITrendingItemRelated[];
}

export interface IRequestOptions {
	body?: any;
	cookies?: Record<string, string>;
	headers?: Record<string, string>;
	method?: string;
	searchParams?: Record<string, string> | URLSearchParams;
	timeout?: number;
	url: string;
	validateStatus?: boolean;
}

/**
 * Form types
 */

export interface IFormField {
	info?: string;
	label?: string;
	name: string;
	options?: { label: string, value: string }[];
	placeholder?: string;
	readonly?: boolean;
	required?: boolean;
	tooltip?: string;
	type?: string;
	value?: string | string[];
}

export interface IForm {
	fields?: IFormField[]
}
