<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch, params, url }) => {
		const resp = await fetch(`/api/action/${params.actionId}?${url.searchParams.toString()}`);
		if (resp.status !== 200) {
			return {
				status: resp.status,
			};
		}
		return {
			props: {
				actionView: await resp.json(),
			}
		};
	}
</script>

<script lang="ts">
	import ActionView from '$lib/components/ActionView.svelte';
	import type { IActionView } from '$lib/types';

	export let actionView: IActionView;
</script>

<ActionView {actionView} />
