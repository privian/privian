<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Widget from '$lib/components/Widget.svelte';
	import CardsWidget from '$lib/widgets/CardsWidget.svelte';
	import GalleryWidget from '$lib/widgets/GalleryWidget.svelte';
	import type { ISearchResult } from '$lib/types';

	export let result: ISearchResult;
	export let q: string | null = null;

	let page: number = 1;

	$: layout = result.layout || 'default';
	$: perPage = layout === 'gallery' ? 0 : 16;
	$: slicedItems = perPage ? result.items ?.slice(0, page * perPage) : result.items ;
	$: hasMore = !!result.items && perPage && result.items.length > (page * perPage);
</script>

<div>
	{#if result.name}
	<div class="flex gap-2 items-center pb-5 text-sm">
		{#if result.icon}
		<Icon icon={result.icon} />
		{/if}

		<span class="text-gray-500">{result.name}</span>
	</div>
	{/if}

	<div class="flex flex-col gap-8">
		{#if slicedItems}
			{#if layout === 'gallery'}
				<GalleryWidget columns={'auto'} hoverScale lightroom square={false} item={{items: slicedItems}} />

			{:else if layout === 'cards'}
				<CardsWidget wrap={true} item={{items: slicedItems}} />

			{:else}
				{#each slicedItems as item}
					<Widget {item} {q} />
				{/each}
			{/if}
		{/if}
	</div>

	{#if hasMore}
	<div class="border-t mt-4 pt-1">
		<button class="btn btn-sm btn-ghost text-gray-400 w-full" on:click={() => page = page + 1}>
			<i class="ri-arrow-down-s-line"></i>
		</button>
	</div>
	{/if}
</div>