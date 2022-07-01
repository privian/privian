<script lang="ts">
	import { formatTimeAgo } from '$lib/format';
	import Image from '$lib/components/Image.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let item: ISearchResultItem;
	export let wrap: boolean = false;
</script>

<div class="overflow-auto w-full">
	<div class="flex flex-wrap" class:w-max={!wrap} class:flex-nowrap={!wrap} class:flex-wrap={wrap}>
		{#if item.items}
			{#each item.items as card}
			<div class="w-48 pb-2 pr-2 {wrap ? 'lg:w-1/4 lg:max-w-52' : ''}">
				<div class="card border shadow-sm h-full">
					{#if card.image}
					<figure class="bg-base-200 relative m-0">
						{#if card.link}
							<a href={card.link} class="w-full">
								<Image src={card.image} class="object-cover h-32 w-full m-0" />
							</a>
						{:else}
							<Image src={card.image} class="object-cover h-32 w-full m-0" />
						{/if}
						<div class="absolute bottom-2 right-2">
							{#if card.labels}
								{#each card.labels as label}
								<span class="badge text-xs">{@html label}</span>
								{/each}
							{/if}
						</div>
					</figure>
					{/if}

					<div class="card-body flex flex-col p-3 pb-2">
						<div class="flex-1">
							{#if card.title}
								{#if card.link}
								<div class="text-sm">
									<a href={card.link} class="link link-hover">
										{@html card.title}
									</a>
								</div>
								{:else}
								<div class="text-sm">{@html card.title}</div>
								{/if}
							{/if}

							{#if card.snippet}
							<div class="prose mt-3 text-sm line-clamp-3">{@html card.snippet}</div>
							{/if}
						</div>

						{#if card.footer || card.timestamp}
						<div class="flex text-xs">
							<div class="flex-1">{@html card.footer}</div>
							{#if card.timestamp}
							<div class="opacity-60">
								{formatTimeAgo(card.timestamp)}
							</div>
							{/if}
						</div>
						{/if}
					</div>
				</div>
			</div>
			{/each}
		{/if}
	</div>
</div>