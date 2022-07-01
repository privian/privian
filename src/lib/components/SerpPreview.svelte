<script lang="ts">
	import { browser } from '$app/env';
	import { _ } from 'svelte-i18n';
	import Icon from '$lib/components/Icon.svelte'
	import Image from '$lib/components/Image.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import { previewItem, previewLoading } from '$lib/stores';
	import type { IPreviewResult } from '$lib/types';
	
	export let compact: boolean = false;
	export let result: IPreviewResult | undefined;

	let elContent: HTMLElement;
	let loading: boolean = false;
	let loadedLink: string;
	let previewResult: IPreviewResult | undefined = result;

	previewItem.subscribe((item) => {
		if (browser && item?.link && item.link !== loadedLink) {
			loadedLink = item.link;
			if (previewResult?.link !== loadedLink) {
				load();
			}
		}
	});

	async function load() {
		loading = true;
		$previewLoading = true;
		if ($previewItem) {
			const item = $previewItem;
			const resp = await fetch(`/api/preview`, {
				body: JSON.stringify({
					url: item.link!,
				}),
				headers: {
					'content-type': 'application/json',
				},
				method: 'POST',
			});
			previewResult = await resp.json();
			if (elContent) {
				elContent.scrollTop = 0;
			}
			$previewLoading = false;
			loading = false;
		}
	}
</script>

<div
	class="rounded-lg w-full bg-base-100"
	class:sticky={!compact}
	class:top-24={!compact}
	class:card={!compact}
	class:border={!compact}
	class:shadow-sm={!compact}
	class:hidden={!compact && loading}
>
	<div class="p-0 flex flex-col" class:card-body={!compact} style="{!compact ? 'max-height: 80vh' : ''}">
		<div class="px-6 pt-4 pb-1">
			<div class="flex gap-4">
				{#if previewResult?.icon}
				<div class="pt-1.5">
					<Icon icon={previewResult.icon} />
				</div>
				{/if}

				<div class="flex-1 prose max-w-full">
					<a href={$previewItem?.link} class="link link-hover text-lg">{@html previewResult?.title || $previewItem?.title}</a>

					{#if previewResult?.subtitle}
					<div class="text-sm">
						{@html previewResult?.subtitle}
					</div>
					{/if}
				</div>

				{#if previewResult?.deeplinks}
				<div>
					{#each previewResult.deeplinks as link}
					<a href={decodeURIComponent(link.link)}>
						<Icon icon={link.icon} />
					</a>
					{/each}
				</div>
				{/if}
			</div>
		</div>


		{#if loading}
		<div class="flex justify-center py-10">
			<Spinner />
		</div>

		{:else if previewResult?.html}
		<article bind:this={elContent} class="flex-1 prose max-w-full text-sm overflow-auto px-6 pt-0 pb-4">
			{#if previewResult?.image}
			<div class="float-right ml-6 mb-4">
				<Image src={previewResult.image} width="160" class="rounded" />
			</div>
			{/if}

			{@html previewResult.html}
		</article>
		{:else}
		<div class="text-center opacity-60 py-10">
			<Icon icon="error-warning-line" class="ri-2x" />
			<div class="text-xs">
				{$_('text.unable_to_fetch')}
			</div>
		</div>
		{/if}

		{#if previewResult?.html && previewResult?.footer}
		<div class="px-6 py-4">
			<div class="prose max-w-full text-xs">
				{@html previewResult.footer}
			</div>
		</div>
		{/if}
	</div>
</div>