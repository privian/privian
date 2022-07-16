<script lang="ts">
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { actionView, prompt, toast } from '$lib/stores';
	import Icon from '$lib/components/Icon.svelte';
	import type { ISearchResultItemAction, IActionResult, IActionView } from '$lib/types';

	export let action: ISearchResultItemAction;
	export let ghost: boolean = false;

	let error: string | null = null;
	let loading: boolean = false;

	async function handleResponse<T>(resp: Response): Promise<T | null> {
		let body: any;
		if (resp.headers.get('content-type')?.includes('/json')) {
			body = await resp.json();
		}
		if (resp.status > 400) {
			throw new Error(body?.message || `Failed (${resp.status})`);
		}
		return body;
	}

	async function loadView() {
		loading = true;
		error = null;
		try {
			const resp = await fetch(`/api/action/${action.id}?${new URLSearchParams(action.parameters || {}).toString()}`);
			const view = await handleResponse<IActionView>(resp);
			if (view?.prompt?.text) {
				$prompt = {
					...view.prompt,
					handler: (ok: boolean) => {
						if (ok) {
							submit();
						}
					},
				};

			} else if (view) {
				$actionView = {
					...view,
					id: action.id,
				};
			} else {
				return submit();
			}

		} catch (err: any) {
			error = err?.message || err;
			$toast = {
				text: error,
				type: 'error',
			};

		} finally {
			loading = false;
		}
	}

	async function submit() {
		loading = true;
		try {
			const resp = await fetch(`/api/action/${action.id}?${new URLSearchParams(action.parameters || {}).toString()}`, {
				body: JSON.stringify({}),
				headers: {
					'content-type': 'application/json',
				},
				method: 'POST',
			});
			const result = await handleResponse<IActionResult>(resp);
			if (result?.toast) {
				$toast = result.toast;
			}

		} catch (err: any) {
			error = err?.message || err;
			$toast = {
				text: error,
				type: 'error',
			};

		} finally {
			loading = false;
		}
		await invalidate($page.url.toString());
	}
</script>

<span class="{$$restProps.class}" class:tooltip={!!action.tooltip || error} data-tip={error || action.tooltip}>
	<a
		href={`/action/${action.id}`}
		class="btn btn-sm btn-primary flex flex-nowrap gap-2"
		class:loading={loading}
		class:btn-circle={!!action.icon && !action.label}
		class:btn-outline={!ghost}
		class:btn-ghost={ghost}
		on:click|preventDefault={() => loadView()}
		>
		{#if error}
			<Icon icon="error-warning-line" class="text-error" />
		{:else if action.icon}
			{#if !loading}
			<Icon icon={action.icon} />
			{/if}
		{/if}
		{#if action.label}
			<span>{action.label}</span>
		{/if}
	</a>
</span>