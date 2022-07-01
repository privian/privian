<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch, params }) => {
		const resp = await fetch(`/api/action/${params.actionId}`);
		if (resp.status !== 200) {
			return {
				status: resp.status,
			};
		}
		return {
			props: {
				action: await resp.json(),
			}
		};
	}
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import Action from '$lib/components/Action.svelte';
	import type { ISearchAction } from '$lib/types';

	export let action: ISearchAction;
</script>

<Action {action} />
