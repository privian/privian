<script lang="ts">
  import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { debounce } from '$lib/helpers';
	import { searchHistory, searchHistoryEnabled } from '$lib/stores';
	import Icon from '$lib/components/Icon.svelte';
	import type { ISearchSuggestionsResult, ISearchSuggestionsResultItem } from '$lib/types';

	let elDropdown: HTMLElement;
	let elInput: HTMLInputElement;
	let focused: boolean = false;
	let query: string = '';
	let result: ISearchSuggestionsResult | null = null;
	let tab: string = 'suggestions';

	const _onBlur = debounce(onBlur, 150);
	const _load = debounce(load, 150);

	const tabShortcuts: Record<string, string> = {
		'h': 'history',
		's': 'suggestions',
		't': 'trending',
	};

	$: onTabChange(tab);

	page.subscribe(({ url }) => {
		const q = $page.url.searchParams.get('q')?.trim() || '';
		if (query !== q) {
			query = q;
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', onDocumentKeyDown);
		}
	});

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', onDocumentKeyDown);
		}
	});

	function clear() {
		query = '';
		elInput?.focus();
	}

	function getLink(item: ISearchSuggestionsResultItem | string) {
		const q = typeof item === 'string' ? item : item.label;
		const url = new URL($page.url);
		url.searchParams.set('q', q);
		return url.toString();
	}

	async function load() {
		if (tab === 'history') {
			return loadHistory();
		}
		try {
			const resp = await fetch(`/api/suggestions`, {
				body: JSON.stringify({
					category: tab === 'trending' ? 'trending' : void 0,
					query: query.trim(),
				}),
				headers: {
					'content-type': 'application/json',
				},
				method: 'POST',
			});
			result = await resp.json();
			resetItems();
		} catch (err) {
			console.log(err);
			return;
		}
	}

	async function loadHistory() {
		result = {
			items: $searchHistory.map((label) => ({ icon: 'history-line', label })),
		};
	}

	function navigateItems(dir: number, cls: string = 'focus') {
		const items: Element[] = [].slice.call(elDropdown.querySelectorAll('.dropdown-item:not(.disabled)'));
		let activeItem = elDropdown.querySelector('.' + cls);
		if (!activeItem) {
			dir = 0;
			activeItem = items[0];
		}
		const idx = Math.max(0, Math.min(items.length - 1, items.indexOf(activeItem) + dir));
		activeItem?.classList.remove(cls);
		const targetItem = items[idx];
		if (targetItem) {
			targetItem.classList.add(cls);
			targetItem.scrollIntoView(false);
			if (targetItem.getAttribute('data-q')) {
				query = String(targetItem.getAttribute('data-q') || '') + ' ';
				elInput.setSelectionRange(elInput.value.length, elInput.value.length);
			}
		}
	}

	function resetItems() {
		elDropdown.querySelector('.focus')?.classList.remove('focus');
	}

	function onBlur() {
		if (!elInput?.matches(':focus')) {
			focused = false;
		}
	}

	function onFocus() {
		focused = true;
		_load();
	}

	function onDocumentKeyDown(ev: KeyboardEvent) {
		if (ev.target === document.body && ev.key === '/') {
			ev.preventDefault();
			ev.stopPropagation();
			elInput?.focus();
		}
	}

	function onKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Escape' && focused) {
			elInput?.blur();
		} else if (ev.key === 'Enter') {
			ev.preventDefault();
			ev.stopPropagation();
			submit();
		} else if (ev.key === 'ArrowUp' || (ev.key === 'Tab' && ev.shiftKey)) {
			ev.preventDefault();
			ev.stopPropagation();
			navigateItems(-1);	
		} else if (ev.key === 'ArrowDown' || ev.key === 'Tab') {
			ev.preventDefault();
			ev.stopPropagation();
			navigateItems(1);	
		} else if (ev.ctrlKey && Object.keys(tabShortcuts).includes(ev.key)) {
			ev.preventDefault();
			ev.stopPropagation();
			tab = tabShortcuts[ev.key];
		} else {
			_load();
		}
	}

	function onItemClick(item: ISearchSuggestionsResultItem) {
		query = item.label;
		submit();
	}

	function onItemRemoveClick(item: ISearchSuggestionsResultItem) {
		$searchHistory = $searchHistory.filter((label) => label !== item.label);
		loadHistory();
		elInput?.focus();
	}

	function onTabChange(_tab: string) {
		result = null;
		switch (tab) {
			case 'history':
				loadHistory();
				break;
			default:
				// noop
		}
	}

	function onTabClick(tabName: string) {
		tab = tabName;
		elInput?.focus();
	}

	function submit() {
		const q = query.trim();
		if (q) {
			goto(getLink(q).toString());
			if ($searchHistoryEnabled) {
				$searchHistory = [q, ...$searchHistory.filter((term) => term !== q)].slice(0, 10);
			}
			elInput?.blur();
			resetItems();
		}
	}
</script>

<form method="get" class="dropdown w-full" on:submit|preventDefault={() => submit()}>
	<div class="relative w-full">
		<div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
			<i class="ri-search-line text-gray-500 dark:text-gray-400"></i>
		</div>

		<input
			bind:this={elInput}
			bind:value={query}
			name="q"
			type="text"
			class="input input-bordered rounded block w-full pl-10 text-lg"
			placeholder={$_('placeholder.search')}
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			on:keydown={onKeydown}
			on:blur={_onBlur}
			on:focus={onFocus}
		/>

		<button type="submit" class="hidden"></button>

		<div class="flex gap-3 absolute inset-y-0 right-0 items-center pr-3">
			{#if focused}
				<button tabindex="-1" type="button" on:click|preventDefault={() => clear()}>
					<i class="ri-close-line opacity-60"></i>
				</button>
			{:else if browser}
				<kbd class="kbd kbd-sm bg-base-100 opacity-60">/</kbd>
			{/if}
		</div>
	</div>

	<div bind:this={elDropdown} class="dropdown-content flex flex-col mt-1 rounded border border-slate-400 shadow-2xl bg-base-100 rounded-box w-full" class:hidden={!focused} style="max-height:calc(100vh - 120px)">
		<ul class="menu flex-1 overflow-auto">
			{#if !result?.items?.length}
			<li class="text-sm opacity-60">
				<span class="px-4 py-1 leading-6">{$_('placeholder.start_typing')}</span>
			</li>
			{/if}

			{#if result?.notice}
			<li class="menu-title text-sm border-b">
				<span class="px-4 py-1 leading-6">{result?.notice}</span>
			</li>
			{/if}

			{#if result?.items}
				{#each result.items as item}
					{#if item.bang}
					<li class="dropdown-item text-sm" data-q={'!' + item.bang}>
						<a href={getLink(item)} class="flex justify-between px-4 py-1 leading-6" on:click|preventDefault={() => onItemClick(item)}>
							<span class="text-success font-mono">!{item.bang}</span>
							<span class="opacity-60">{@html item.label}</span>
						</a>
					</li>

					{:else if item.command}
					<li class="dropdown-item text-sm" data-q={'/' + item.command}>
						<a href={getLink(item)} class="flex justify-between px-4 py-1 leading-6" on:click|preventDefault={() => onItemClick(item)}>
							<span class="text-success font-mono">/{item.command}</span>
							<span class="opacity-60">{@html item.label}</span>
						</a>
					</li>

					{:else}
					<li class="dropdown-item text-sm" data-q={item.label}>
						<a href={getLink(item)} class="flex-inline pl-2 pr-2 py-1 leading-6" on:click|preventDefault={() => onItemClick(item)}>
							{#if item.image}
							<div class="w-6 flex justify-center">
								<img src={item.image} alt="" class="rounded w-6 h-6 object-cover" />
							</div>
							{:else if item.icon}
							<div class="w-6 text-center">
								<Icon icon={item.icon} />
							</div>
							{/if}

							<div class="flex-1">
								<span class="flex-1">{@html item.label}</span>
								{#if item.description}
								<div class="text-xs opacity-60 line-clamp-1">{@html item.description}</div>
								{/if}
							</div>

							{#if item.aside}
							<div class="opacity-60">
								{@html item.aside}
							</div>
							{/if}

							{#if tab === 'history'}
							<button class="btn btn-circle btn-ghost btn-xs opacity-50" on:click|preventDefault|stopPropagation={() => onItemRemoveClick(item)}>
								<i class="ri-close-line"></i>
							</button>
							{/if}
						</a>
					</li>
					{/if}
				{/each}
			{/if}
		</ul>

		<div class="bg-gray-100 mt-1">
			<div class="tabs px-4 py-1 gap-3">
				<button class="tab text-xs p-0" class:tab-active={tab === 'suggestions'} on:click|preventDefault={() => onTabClick('suggestions')}>
					{$_('label.suggestions')}<kbd class="kbd text-xs opacity-60 px-1 py-0 ml-2">^s</kbd>
				</button> 
				<button class="tab text-xs p-0" class:tab-active={tab === 'trending'} on:click|preventDefault={() => onTabClick('trending')}>
					{$_('label.trending')}<kbd class="kbd text-xs opacity-60 px-1 py-0 ml-2">^t</kbd>
				</button> 

				{#if $searchHistoryEnabled}
				<button class="tab text-xs p-0" class:tab-active={tab === 'history'} on:click|preventDefault={() => onTabClick('history')}>
					{$_('label.history')}<kbd class="kbd text-xs opacity-60 px-1 py-0 ml-2">^h</kbd>
				</button> 
				{/if}
			</div>
		</div>
  </div>
</form>