<script lang="ts">
	import { previewItem, previewLoading } from '$lib/stores';
	import Icon from '$lib/components/Icon.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let item: ISearchResultItem;

	$: isActive = $previewItem === item;
	$: isLoading = isActive && !!$previewLoading;
</script>

<button
	class="btn btn-sm btn-circle btn-ghost"
	class:loading={isLoading}
	class:btn-primary={isActive}
	class:btn-ghost={!isActive}
	on:click={() => $previewItem = item}
>
	{#if !isLoading}
	<Icon icon="eye-fill" />
	{/if}
</button>