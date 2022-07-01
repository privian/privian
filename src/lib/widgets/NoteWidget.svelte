<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let editable: boolean = false;
	export let editing: boolean = false;
	export let item: ISearchResultItem;

	const dispatch = createEventDispatcher();

	function onCheckboxChange(info: { progress: number }) {
		if (item.options?.pin && item.options.progress !== info.progress) {
			item.options.progress = info.progress;
			dispatch('save', item);
			editing = false;
		}
	}
</script>

<div>
	<Markdown
		bind:value={item.snippet}
		editable={editing}
		class="prose max-w-full text-sm"
		on:checkbox={(ev) => onCheckboxChange(ev.detail)}
		on:progress={(ev) => onCheckboxChange(ev.detail)}
		on:dblclick={() => editing = !!editable}
	/>
</div>