<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ActionView from '$lib/components/ActionView.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { toast } from '$lib/stores';
	import type { IActionView } from '$lib/types';

	export let actionView: IActionView | null;

	let actionEl: ActionView;
	let error: Error | string | null = null;
	let loading: boolean = false;
	let open: boolean = !!actionView;
	let submitting: boolean = false;

	// $: open = !!actionView;

	function onSubmitClick() {
		actionEl?.submit();
	}

	function onSuccess(data: any) {
		// open = false;
		actionView = null;
		if (data?.toast) {
			$toast = data.toast;
		}
	}
</script>

<Modal title={actionView?.title} subtitle={actionView?.subtitle} bind:open={actionView}>
	<div class="p-4">
		{#if loading}
		<div class="flex justify-center">
			<Spinner />
		</div>
		{/if}

		{#if error}
		<ErrorMessage {error} />
		{/if}

		{#if actionView}
		<ActionView bind:this={actionEl} bind:loading={submitting} {actionView} onSuccess={onSuccess} />
		{/if}
	</div>

	<div slot="actions" class="flex items-stretch">
		{#if !loading}
		<label for="" class="btn btn-ghost px-8 rounded-none" class:btn-disabled={submitting} on:click={() => actionView = null}>{$_('action.cancel')}</label>
		<label for="" class="btn btn-primary px-8 rounded-none flex-inline gap-3" class:loading={submitting} on:click={() => onSubmitClick()}>
			{$_('action.save')}
		</label>
		{/if}
	</div>
</Modal>