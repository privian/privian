/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface User {
		avatar?: string;
		id: string;
		name?: string;
		org?: string;
		role?: string;
	}
	interface Locals {
		multitenant: boolean;
		jwt: string | null;
		locale: string;
		country: string;
		safeSearch: boolean;
		region: string;
		user: User | null;
	}
	// interface Platform {}
	interface Session {
		multitenant: boolean;
		user: User | null;
	}
	// interface Stuff {}
}

declare const MathJax: any;
declare module 'mathjax/es5/tex-svg-full';
declare module 'frappe-charts';
