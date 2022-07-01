<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface IDropdowItem {
		label: string;
		handler?: () => void;
		value?: string;
	}

	export let items: IDropdowItem[] = [];
	export let right: boolean = false;
	export let select: boolean = false;
	export let value: string | null = null;

	const dispatch = createEventDispatcher();

	function onItemClick(item: IDropdowItem) {
		if (select && item.value !== void 0) {
			value = item.value;
			dispatch('select', value);
		}
		if (item.handler) {
			item.handler();
		}
	}
</script>

<div class="dropdown dropdown-end not-prose" class:dropdown-end={right}>
	<slot>
		<label for="" tabindex="0" class="btn btn-sm btn-circle btn-ghost opacity-25 hover:opacity-100">
			<Icon icon="more-2-line" />
		</label>
	</slot>
	<div tabindex="0" class="bg-base-100 p-0 rounded border border-slate-400 drop-shadow-xl dropdown-content rounded-box w-52 z-50">
		<ul tabindex="0" class=" menu menu-compact">
		<slot name="items" {items}>
				{#each items as item}
				<li>
					<button class="flex justify-between" on:click={() => onItemClick(item)}>
						<span class:font-semibold={select && item.value === value}>
							{item.label}
						</span>

						{#if select && item.value === value}
							<Icon icon="check-fill" />
						{/if}
					</button>
				</li>
				{/each}
		</slot>
		</ul>
	</div>
</div>
