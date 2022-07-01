<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Pins from '$lib/components/Pins.svelte';
	import Settings from '$lib/components/Settings.svelte';

	let settings: boolean = false;

	function close() {
		// @ts-ignore
		document.querySelector('#maindrawer').checked = false;
	}
</script>

<div class="bg-base-200 lg:bg-base-100 text-base-content h-screen w-full lg:w-80 flex flex-col">
	<div class="p-4 flex items-center">
		<div class="flex-1">
			{#if settings}
				<button class="btn btn-sm btn-circle btn-ghost" on:click={() => settings = false}>
					<i class="ri-arrow-left-line"></i>
				</button>
			{/if}
		</div>

		<button class="btn btn-sm btn-circle btn-ghost" on:click={() => close()}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
				<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
			</svg>
		</button>
	</div>

	<div class="flex-1 hidden lg:block">
		<Settings />
	</div>

	<div class="flex-1 lg:hidden overflow-hidden">
		{#if settings}
		<Settings />

		{:else}
		<Pins drawer class="h-full">
			<svelte:fragment slot="footer">
				<div class="border-t">
					<button class="btn btn-ghost w-full" on:click={() => settings = true}>{$_('label.settings')}</button>
				</div>
			</svelte:fragment>
		</Pins>
		{/if}
	</div>
</div>