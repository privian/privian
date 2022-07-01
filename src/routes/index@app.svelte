<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch, url }) => {
		const query = url.searchParams.get('q')?.trim();
		const category = url.searchParams.get('category')?.trim();
		const locale = url.searchParams.get('locale')?.trim();
		const filter = [...url.searchParams.entries()].reduce((acc: any, [ key, value ]) => {
			if (key.startsWith('filter[')) {
				const name = key.match(/filter\[(\w+)\]/)?.[1];
				if (name) {
					acc[name] = value;
				}
			}
			return acc;
		}, {});
		let searchResult: any;

		if (query) {
			const resp = await fetch('/api/search', {
				body: JSON.stringify({
					category,
					filter,
					locale,
					query,
				}),
				headers: {
					'content-type': 'application/json',
				},
				method: 'POST',
			});
			const data = await resp.json();
			if (resp.status !== 200) {
				return {
					props: {
						error: data.error,
					},
				};
			}
			searchResult = data;
			if (searchResult.redirect) {
				return {
					status: 301,
					redirect: searchResult.redirect,
				};
			}
		} else {
			const resp = await fetch('/api/provider/Google/trending')
			const json = await resp.json();
			return {
				props: {
					trending: json?.result,
				},
			};
		}
		
		return {
			props: {
				filter,
				searchResult,
			}
		};
	}
</script>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import SearchWith from '$lib/components/SearchWith.svelte';
	import Serp from '$lib/components/Serp.svelte';
	import type { ISearchResult, ITrendingItem } from '$lib/types';

	export let error: any;
	export let filter: Record<string, string> = {};
	export let searchResult: ISearchResult;
	export let trending: ITrendingItem[];

	let showTrendingNews: string | null = null;

	$: trendingNews = (showTrendingNews ? trending?.find((item) => item.label === showTrendingNews)?.related : null) || [];
</script>

{#if error}
<ErrorMessage {error} />
{/if}

{#if searchResult}
<Serp {filter} result={searchResult} />

{:else}
<div class="flex flex-col gap-10">
	<div>
		{#if trending?.length}
		<div class="text-lg">{$_('label.trending')}</div>

		<div class="mt-4 flex flex-wrap gap-2">
			{#each trending as item}
			<div class="text-sm flex gap-3 items-center border rounded-full pl-5 pr-2 py-1" class:border-primary={showTrendingNews === item.label}>
				<div>
					<a href={`/?q=${item.label}`} class="link link-hover">
						<span>{item.label}</span>
					</a>
					{#if item.footer}
					<div class="text-xs opacity-60">{item.footer}</div>
					{/if}
				</div>

				{#if item.related?.length}
				<button
					class="btn btn-sm btn-circle btn-ghost opacity-40 hover:opacity-100"
					class:text-primary={showTrendingNews === item.label}
					class:opacity-100={showTrendingNews === item.label}
					on:click={() => showTrendingNews = item.label}>
					<i class="ri-file-list-3-line"></i>
				</button>
				{/if}
			</div>
			{/each}
		</div>
		{/if}
	</div>

	{#if trendingNews?.length}
	<div>
		<div class="mb-3 text-lg">{$_('label.related_to', { values: { term: showTrendingNews }})}</div>

		<div class="divide-y divide-solid">
			{#each trendingNews as newsItem}
			<div class="py-3">
				<a href={newsItem.link}>{newsItem.title}</a>
				<div class="text-xs --opacity-60">
					{newsItem.footer}
				</div>
			</div>
			{/each}

			<div class="py-3">
				<a href="/" class="text-sm">{$_('action.more')}</a>
			</div>
		</div>
	</div>
	{/if}
</div>
{/if}

{#if error || searchResult?.items?.length === 0}
<div class="border rounded-lg p-4">
	<div class="mb-6">{$_('label.no_results_found')}</div>

	<SearchWith />
</div>
{/if}
