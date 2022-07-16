<script lang="ts">
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import FormInput from '$lib/components/FormInput.svelte';
	import type { IForm } from '$lib/types';

	export let action: string;
	export let errors: Record<string, string> = {};
	export let form: IForm | null = null;
	export let method: string = 'post';
	export let invalidatePage: boolean = true;
	export let loading: boolean = false;
	export let onSuccess: ((data: unknown) => void) | null = null;

	let el: HTMLFormElement;
	let xhrError: string | null = null;

	$: errorJSON = $page.url.searchParams.get('error');
	$: error = errorJSON ? JSON.parse(errorJSON) : xhrError;
	$: onError(error);

	function getFieldComponent(type?: string) {
		switch (type) {
			default:
				return FormInput;
		}
	}

	function onError(_error: any) {
		if (Array.isArray(error?.details)) {
			errors = error.details.reduce((acc: Record<string, string>, { message, path }: { message: string, path: string[] }) => {
				acc[path[0]] = message;
				return acc;
			}, {});
		} else {
			errors = {};
		}
	}

	async function onSubmit() {
		let resp: Response;
		let data: any;
		loading = true;
		try {
			resp = await fetch(action, {
				body: new FormData(el),
				method,
			});
			if (resp.status !== 204) {
				data = await resp.json();
			}

		} catch (err) {
			xhrError = String(err);
			return;

		} finally {
			loading = false;
		}
		if (resp.status >= 400) {
			xhrError = data.error;
			return;
		}
		if (onSuccess) {
			onSuccess(data);
		}
		if (invalidatePage) {
			await invalidate($page.url.toString());
		}
		return true;
	}

	export function submit() {
		if (el?.reportValidity()) {
			onSubmit();
		}
	}
</script>

<form bind:this={el} on:submit|preventDefault={() => onSubmit()} {method} {action} {...$$restProps}>
	{#if error}
	<ErrorMessage {error} class="mb-6" />
	{/if}

	{#if form?.fields}
		{#each form.fields as field}
			<svelte:component
				this={getFieldComponent(field.type)}
				{field}
			></svelte:component>
		{/each}
	{/if}

	<slot {loading} {errors}></slot>

	<slot name="footer">
		<button type="submit" style="display:none"></button>
	</slot>
</form>