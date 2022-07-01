<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Widget from '$lib/components/Widget.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let editing: boolean = false;
	export let icon: string;
	export let item: ISearchResultItem;

	let buttonFocused: boolean = false;
	let elDropdown: HTMLElement;
	let focused: boolean = false;

	$: focused = buttonFocused || elDropdown?.matches(':active');
</script>

<div class="dropdown dropdown-right" class:dropdown-open={focused}>
	<button class="btn btn-circle btn-ghost focus:border-base-300" on:focus={() => buttonFocused = true} on:blur={() => buttonFocused = false}>
		<Icon {icon} class="ri-xl" />
	</button>

	<div bind:this={elDropdown} tabindex="0" class="dropdown-content p-4 border border-slate-400 shadow-2xl bg-base-100 rounded-box w-96">
		{#if true || focused}
		<Widget  editable {item} bind:editing={editing}  />
		{/if}
	</div>
</div>