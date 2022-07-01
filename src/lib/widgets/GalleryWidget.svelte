<script lang="ts">
	import Image from '$lib/components/Image.svelte';
	import { lightroom as lightroomItem } from '$lib/stores';
	import type { ISearchResultItem } from '$lib/types';

	export let columns: number | 'auto' = 5;
	export let hoverScale: boolean = false;
	export let item: ISearchResultItem;
	export let lightroom: boolean = false;
	export let square: boolean = true;

	let el: HTMLElement;

	$: columnsNum = columns === 'auto' ? (typeof screen !== 'undefined' ? Math.floor(screen.width / 200) : 4) : columns;
	$: cols = item?.items?.reduce((acc, item, i) => {
		acc[i % acc.length].push(item);
		return acc;
	}, [...Array(columnsNum)].map(() => []) as ISearchResultItem[][]) || [];

	function onImageClick(ev: Event, imgItem: ISearchResultItem) {
		if (lightroom) {
			ev.preventDefault();
			$lightroomItem = {
				el,
				link: imgItem.link,
				src: imgItem.image!,
				title: imgItem.title,
			};
		}
	}
</script>

<div bind:this={el} class="flex gap-3">
	{#each cols as col, colIdx}
	<div class="w-full">
		{#each col as imgItem, i}
			{#if imgItem.image}
			<div
				class="mb-3 bg-base-100 w-full relative rounded overflow-hidden transition-transform hover:z-40"
				class:hover:scale-125={hoverScale}
				class:hover:shadow-2xl={hoverScale}
			>
				<Image
					src={imgItem.image}
					alt={imgItem.title}
					data-original={imgItem.options?.original}
					data-footer={imgItem.footer}
					data-link={imgItem.link}
					data-index={(i * columnsNum) + colIdx}
					class="object-cover w-full {square ? 'aspect-square' : ''}"
				/>

				<a href={imgItem.link} class="absolute top-0 left-0 w-full h-full flex items-end opacity-0 hover:opacity-80" style="font-size: 10px;" on:click={(ev) => onImageClick(ev, imgItem)}>
					<div class="px-2 py-1 w-full bg-base-content text-base-100">
						{#if imgItem.title}
						<div class="line-clamp-2">
							{@html imgItem.title}
						</div>
						{/if}
						{#if imgItem.footer}
						<div class="opacity-70">
							{@html imgItem.footer}
						</div>
						{/if}
					</div>
				</a>
			</div>
			{/if}
		{/each}
	</div>
	{/each}
</div>