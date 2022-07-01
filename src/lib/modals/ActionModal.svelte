<script lang="ts">
	import { browser } from '$app/env';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Action from '$lib/components/Action.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { NotFoundError } from '$lib/api/errors';
	import { toast } from '$lib/stores';
	import type { ISearchAction } from '$lib/types';

	export let actionId: string | null;
	export let actionParams: Record<string, string> | null;

	let action: ISearchAction | null;
	let actionEl: Action;
	let error: Error | string | null = null;
	let loading: boolean = false;
	let open: boolean = !!actionId;
	let submitting: boolean = false;

	$: browser && onActionChange(actionId);
	$: browser && onOpenChange(open);

	function onActionChange(id: string | null) {
		if (id) {
			action = null;
			open = true;
			load();
		}
	}

	function onOpenChange(_open: boolean) {
		if (!open) {
			actionId = null;
		}
	}

	function onSubmitClick() {
		actionEl?.submit();
	}

	function onSuccess(data: any) {
		open = false;
		if (data?.toast) {
			$toast = data.toast;
		}
	}

	async function load() {
		error = null;
		loading = true;
		try {
			const resp = await fetch(`/api/action/${actionId}?${new URLSearchParams(actionParams || {}).toString()}`);	
			if (resp.status !== 200) {
				error = new NotFoundError();
				return;
			}
			action = await resp.json();
		} catch (err: any) {
			error = String(err);
		} finally {
			loading = false;
		}
	}
</script>

<Modal title={action?.title} subtitle={action?.subtitle} bind:open={open}>
	<div class="p-4">
		{#if loading}
		<div class="flex justify-center">
			<Spinner />
		</div>
		{/if}

		{#if error}
		<ErrorMessage {error} />
		{/if}

		{#if actionId && action}
		<Action bind:this={actionEl} bind:loading={submitting} {actionId} {actionParams} {action} onSuccess={onSuccess} />
		{/if}
	</div>

	<div slot="actions" class="flex items-stretch">
		{#if !loading}
		<label for="my-modal" class="btn btn-ghost px-8 rounded-none" class:btn-disabled={submitting} on:click={() => open = false}>Cancel</label>
		<label for="my-modal" class="btn btn-primary px-8 rounded-none flex-inline gap-3" class:loading={submitting} on:click={() => onSubmitClick()}>
			Save
		</label>
		{/if}
	</div>
</Modal>