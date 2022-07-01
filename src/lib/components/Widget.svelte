<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { info } from '$lib/stores';
	import CardsWidget from '$lib/widgets/CardsWidget.svelte';
	import GalleryWidget from '$lib/widgets/GalleryWidget.svelte';
	import ItemWidget from '$lib/widgets/ItemWidget.svelte';
	import TableWidget from '$lib/widgets/TableWidget.svelte';
	import CalculatorWidget from '$lib/widgets/CalculatorWidget.svelte';
	import CurrencyWidget from '$lib/widgets/CurrencyWidget.svelte';
	import NoteWidget from '$lib/widgets/NoteWidget.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Image from '$lib/components/Image.svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import PreviewButton from '$lib/components/PreviewButton.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import PrivacyScore from '$lib/components/PrivacyScore.svelte';
	import type { ISearchResultItem } from '$lib/types';

	export let compact: boolean = false;
	export let dropdown: boolean = false;
	export let editable: boolean = false;
	export let editing: boolean = false;
	export let item: ISearchResultItem;
	export let q: string | null = null;

	const dispatch = createEventDispatcher();
	const noSnippet = ['note'];
	
	let buttons: any[] = [];
	let itemEditable: ISearchResultItem;

	$: cmp = getComponent(item.type!);
	$: privacyRisk = item.privacyScore && item.privacyScore < 3.5;
	$: privacyExcellent = item.privacyScore && item.privacyScore >= 7;
	$: onItemChange(item);
	$: link = item.link?.startsWith('?') ? getFullURL(item.link, $page.url) : item.link;

	function getComponent(type: string) {
		switch (type) {
			case 'cards':
				return CardsWidget;
			case 'currency':
				return CurrencyWidget;
			case 'calculator':
				return CalculatorWidget;
			case 'gallery':
				return GalleryWidget;
			case 'note':
				return NoteWidget;
			case 'table':
				return TableWidget;
			default:
				return ItemWidget;
		}
	}

	function getFullURL(link: string, url: URL) {
		const linkUrl = new URL(link, url.origin);
		const resultUrl = new URL(url.toString());
		for (let [ k, v ] of linkUrl.searchParams.entries()) {
			resultUrl.searchParams.set(k, v);
		}
		return resultUrl.toString();
	}

	function onCancel() {
		onItemChange(item);
		editing = false;
	}

	function onItemChange(_item: ISearchResultItem) {
		itemEditable = Object.assign({}, item || {});
	}

	function onSave() {
		Object.assign(item, itemEditable);
		dispatch('save', item);
		editing = false;
	}
</script>

<div {...$$restProps}>
	<div>
		<div class="prose max-w-full flex gap-2 mb-1">
			<div class="flex-1" class:truncate={!editing}>
				{#if editing}
				<input type="text" placeholder="Enter a title..." class="input w-full mb-1" bind:value={itemEditable.title} />

				{:else if item?.title}
				<div class="text-lg text-ellipsis overflow-hidden" on:dblclick={() => editing = !!editable}>
					{#if link}
					<a href={link} class="text-primary link link-hover" class:link-primary={item.link?.startsWith('?')}>
						{@html item.title}
					</a>
					{:else}
					{@html item.title}
					{/if}
				</div>
				{/if}

				{#if editing}
				<input type="text" placeholder="Subtitle..." class="input w-full mb-1" bind:value={itemEditable.subtitle} />

				{:else if item?.subtitle}
				<div class="text-sm opacity-60">
					{@html item.subtitle}
				</div>
				{/if}

				{#if editing}
				<input type="text" placeholder="https://..." class="input w-full" bind:value={itemEditable.link} />

				{:else if item?.link && !item.link.startsWith('?')}
				<div class="text-sm">
					<div class="flex items-center gap-2">
							{#if item.privacyScore}
								<PrivacyScore score={item.privacyScore} iconOnly />
							{/if}
							<a href={item.link} title={item.link} class="text-ellipsis overflow-hidden" class:text-success={!privacyRisk} class:opacity-80={privacyRisk}>
								{decodeURIComponent(item.link)}
							</a>
					</div>
				</div>
				{/if}
			</div>

			<div class="flex gap-1">
				{#if item.actions}
					{#each item.actions as action}
					<ActionButton {action} />
					{/each}
				{/if}

				{#if buttons}
					{#each buttons as btn}
						{#if btn.dropdown}
						<Dropdown>
							{#if btn.icon}
							<Icon icon={btn.icon} />
							{:else}
							{btn.label}
							{/if}

							<svelte:fragment slot="items">
								{#each btn.dropdown as dropdownItem}
									{#if dropdownItem.type === 'toggle'}
									<li>
										<label>
											<input type="checkbox" class="toggle toggle-xs" on:change={(ev) => dropdownItem.handler(ev.currentTarget.checked)} /> {dropdownItem.label}
										</label>
									</li>
									{:else if dropdownItem.header}
									<li class="menu-title">
										<span>{dropdownItem.header}</span>
									</li>
									{:else}
									<li>
										<button on:click={() => dropdownItem.handler()}>{dropdownItem.label}</button>
									</li>
									{/if}
								{/each}
							</svelte:fragment>
						</Dropdown>

						{:else}
						<button class="btn btn-sm btn-circle btn-ghost opacity-25 hover:opacity-100" on:click={() => btn.handler()}>
							{#if btn.icon}
							<Icon icon={btn.icon} />
							{:else}
							{btn.label}
							{/if}
						</button>
						{/if}
					{/each}
				{/if}

				{#if browser}
					{#if dropdown}
					<div class="dropdown dropdown-end not-prose">
						<label for="" tabindex="0" class="btn btn-sm btn-circle btn-ghost">
							<i class="ri-more-2-line"></i>
						</label>
						<div tabindex="0" class="bg-base-100 p-0 rounded border border-slate-400 shadow-2xl dropdown-content rounded-box w-52">
							<slot name="dropdown" {editable}>
								<ul tabindex="0" class=" menu menu-compact">
									<li>
										<button on:click={() => $info = item}>
											<Icon icon="information-line" class="mr-2" />Info
										</button>
									</li>
								</ul>
							</slot>
						</div>
					</div>

					{:else}
					<button tabindex="-1" class="btn btn-sm btn-circle btn-ghost -opacity-60 hover:opacity-100" on:click={() => $info = item}>
						<Icon icon="information-line" />
					</button>

					{#if editable}
					<button tabindex="-1" class="btn btn-sm btn-circle btn-ghost" disabled={editing} on:click|preventDefault={() => editing = true}>
						<i class="ri-edit-line"></i>
					</button>
					{/if}
					{/if}

					{#if item.preview && !compact}
					<PreviewButton {item} />
					{/if}
				{/if}
			</div>
		</div>

		<div class="flex gap-4">
			{#if item?.image}
			<div>
				<Image src={item.image} class="rounded w-28" />
			</div>
			{/if}

			<div class="flex-1">
				{#if item?.labels?.length}
				<div class="flex gap-1 mb-1">
					{#each item.labels as label}
					<span class="badge text-xs">{@html label}</span>
					{/each}
				</div>
				{/if}
				{#if item?.snippet && !noSnippet.includes(item?.type || '')}
				<div class="prose max-w-full text-sm" on:dblclick={() => editing = !!editable}>
					{@html item.snippet}
				</div>
				{/if}

				{#if item.footer}
				<div class="mt-2 prose text-sm">
					{@html item.footer}
				</div>
				{/if}
			</div>
		</div>

	</div>

	<svelte:component	
		this={cmp}
		{compact}
		{q}
		bind:item={itemEditable}
		bind:buttons={buttons}
		bind:editable={editable}
		bind:editing={editing}
		on:save={() => onSave()}
	></svelte:component>


	{#if editing}
		<div class="flex mt-2">
			<div>
				<button class="btn btn-primary btn-sm" on:click|preventDefault={() => onSave()}>{$_('action.save')}</button>
				<button class="btn btn-ghost btn-sm" on:click|preventDefault={() => onCancel()}>{$_('action.cancel')}</button>
			</div>

			<div>
				
			</div>
		</div>
	{/if}
</div>
