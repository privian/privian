<script lang="ts">
	import Form from '$lib/components/Form.svelte';
	import type { ISearchAction } from '$lib/types';

	export let action: ISearchAction;
	export let actionId: string;
	export let actionParams: Record<string, string> | null = null;
	export let loading: boolean = false;
	export let onSuccess: ((data: unknown) => void) | null = null;
	
	let form: Form;

	export function submit() {
		form?.submit();
	}
</script>

<div>
	<Form
		bind:this={form}
		bind:loading={loading}
		action={`/api/action/${actionId}?${new URLSearchParams(actionParams || {}).toString()}`}
		fields={action.form?.fields}
		{onSuccess}
	></Form>
</div>
