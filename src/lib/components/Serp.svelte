<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { previewItem, previewModalEnabled } from '$lib/stores';
	import Icon from '$lib/components/Icon.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import SerpBlock from '$lib/components/SerpBlock.svelte';
	import SerpPreview from '$lib/components/SerpPreview.svelte';
	import type { ISearchResult } from '$lib/types';

	export let filter: Record<string, string> = {};
	export let result: ISearchResult; 

	$: category = $page.url.searchParams.get('category') || result?.category;
	$: q = $page.url.searchParams.get('q');
	$: categories = result?.categories || [];
	$: onCategoriesChange(categories);
	$: layout = result.layout || 'default';
	$: previewModal = !!$previewModalEnabled;
	$: $previewItem = !previewModal && result?.items?.find((item, i) => i < 6 && !!item.preview) || null;

	function getCategoryUrl(query: string | null, cat: string) {
		const url = new URL($page.url.pathname, $page.url.origin);
		if (query) {
			url.searchParams.set('q', query);
		}
		url.searchParams.set('category', cat);
		return url.toString();
	}

	function onCategoriesChange(_categories: string[]) {
		if (!category || !categories.includes(category)) {
			category = categories[0];
		}
	}

	function onFilterSelect(filterName: string, filterValue: string) {
		const url = new URL($page.url);
		if (!filterValue) {
			url.searchParams.delete(`filter[${filterName}]`);
		} else {
			url.searchParams.set(`filter[${filterName}]`, filterValue);
		}
		goto(url.toString());
	}

	function onFilterClear() {
		const url = new URL($page.url);
		[...url.searchParams.entries()].forEach(([ key ]) => {
			if (key.startsWith('filter[')) {
				url.searchParams.delete(key);
			}
		});
		goto(url.toString());
	}
</script>

<div class="flex flex-wrap gap-y-10">
	<div class="w-full {result.layout !== 'gallery' ? 'xl:w-7/12' : ''}">
		{#if categories.length > 1}
		<div class="flex">
			<div class="tabs">
				{#each categories as item}
				<a href={getCategoryUrl(q, item)} class="tab tab-bordered" class:tab-active={item === category}>{item}</a> 
				{/each}
			</div>
			<div class="border-b flex-1"></div>
		</div>
		{/if}

		{#if result?.filters?.length}
		<div class="p-1 flex gap-1 ">
			{#each result.filters as filterItem}
			<Dropdown select items={filterItem.options} value={filter[filterItem.name] || filterItem.options[0]?.value} on:select={(ev) => onFilterSelect(filterItem.name, ev.detail)}>
				<label for="" tabindex="0" class="btn btn-sm btn-ghost border-none">
				 	{(filter[filterItem.name] ? filterItem.options.find((i) => i.value === filter[filterItem.name])?.label : null) || filterItem.label} <Icon icon="arrow-down-s-fill" class="ml-1" />
				</label>
			</Dropdown>
			{/each}

			{#if Object.keys(filter || {}).length}
			<button class="btn btn-sm btn-ghost opacity-60 hover:opacity-100" on:click={() => onFilterClear()}>
				<Icon icon="close-line" class="mr-1" /> Clear
			</button>
			{/if}
		</div>
		{/if}

		{#if result?.items}
		<div class="mt-6">
			<SerpBlock {result} {q} />
		</div>
		{/if}
	</div>

	{#if !previewModal && layout !== 'gallery'}
	<div class="hidden xl:block w-full xl:w-5/12 xl:pl-10 2xl:pl-20">
		{#if result?.preview || $previewItem}
		<SerpPreview result={result.preview} />
		{/if}
	</div>
	{/if}

</div>