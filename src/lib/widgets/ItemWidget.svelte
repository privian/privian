<script lang="ts">
	import { browser } from '$app/env';
	import PreviewButton from '$lib/components/PreviewButton.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let compact: boolean = false;
	export let item: ISearchResultItem;
</script>

<div class="prose max-w-full">
	{#if item.deeplinks?.length}
		<div
			class="mt-4 grid gap-1"
			class:grid-cols-2={!compact}
			class:gap-4={!compact}
			class:gap-x-10={!compact}
			class:pl-6={!compact}
			class:border-l={!compact}
		>
			{#each item.deeplinks as link}
				{#if link.title}
				<div class="flex gap-1">
					<div class="flex-1">
						<a href={link.link} class="link link-hover" class:text-sm={compact}>{@html link.title}</a>
						{#if link.snippet}
						<div class="text-sm line-clamp-2">{@html link.snippet}</div>
						{/if}
					</div>

					<div>
						{#if browser && !compact && link.preview}
						<PreviewButton item={link} />
						{/if}
					</div>
				</div>
				{/if}
			{/each}
		</div>
	{/if}

	{#if item.items?.length}
		<div
			class="grid grid-cols-1 gap-4"
			class:pl-6={!compact}
			class:border-l={!compact}
			class:mt-4={!item.deeplinks}
		>
			{#if item.deeplinks}
			<!-- spacer -->
			<div></div>
			{/if}
			{#each item.items as subitem}
				{#if subitem.title}
				<div class="flex gap-1">
					<div>
						<a href={subitem.link} class="link link-hover">{@html subitem.title}</a>
						{#if subitem.snippet}
						<div class="text-sm line-clamp-2">{@html subitem.snippet}</div>
						{/if}
					</div>

					<div>
						{#if browser && !compact && subitem.preview}
						<PreviewButton item={subitem} />
						{/if}
					</div>
				</div>
				{/if}
			{/each}
		</div>
	{/if}

</div>