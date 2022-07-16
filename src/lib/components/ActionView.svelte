<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
	import Form from '$lib/components/Form.svelte';
	import type { IActionView } from '$lib/types';

	export let actionView: IActionView;
	export let loading: boolean = false;
	export let onSuccess: ((data: unknown) => void) | null = null;
	
	let form: Form;

	export function submit() {
		form?.submit();
	}
</script>

<div>
	{#if actionView?.form}
	<Form
		bind:this={form}
		bind:loading={loading}
		action={`/api/action/${actionView.id}?${new URLSearchParams(actionView.parameters || {}).toString()}`}
		form={actionView.form}
		{onSuccess}
	></Form>
	
	{:else}
		{@html actionView?.html || ''}
	{/if}

	{#if actionView.actions?.length}
	<div class="mt-4">
		<div class="flex gap-3">
			{#each actionView.actions as action}
			<ActionButton {action} class="block" />
			{/each}
		</div>
	</div>
	{/if}
</div>
