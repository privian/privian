<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (session?.user) {
			return {
				status: 302,
				redirect: '/'
			};
		}
		return {
			props: {},
		};
	}
</script>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import 'remixicon/fonts/remixicon.css'
	import '../app.scss';
	import '$lib/i18n';
</script>

<svelte:head>
	<title>Privian</title>
</svelte:head>

<div class="container mx-auto xl:px-64 flex items-start py-36">
	<div class="flex-1">
		<div class="mb-6">
			<img src="logo.svg" alt="privian" width="140" />
		</div>

		<p class="text-lg">{$_('text.login_info')}</p>
	</div>

	<div>
		<slot />
	</div>
</div>
