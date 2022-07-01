<script lang="ts">
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import type { ISearchResultItem, ISearchResultItemAction } from '$lib/types';
	import { actionId, actionParams, prompt, toast } from '$lib/stores';
	import Icon from '$lib/components/Icon.svelte';

	export let action: ISearchResultItemAction;
	export let item: ISearchResultItem | null = null;
	export let ghost: boolean = false;

	let error: string | null = null;
	let loading: boolean = false;

	function onClick() {
		if (action.confirm) {
			$prompt = {
				handler: (ok: boolean) => {
					if (ok) {
						submit();
					}
				},
				text: item?.title && typeof action.confirm === 'string' ? action.confirm.replace(/\%s/g, item.title) : action.confirm,
			};

		} else if (action.instant) {
			submit();

		} else {
			$actionId = action.id;
			$actionParams = action.parameters || null;
		}
	}

	async function submit() {
		error = null;
		loading = true;
		try {
			const resp = await fetch(`/api/action/${action.id}?${new URLSearchParams(action.parameters || {}).toString()}`, {
				body: JSON.stringify({}),
				headers: {
					'content-type': 'application/json',
				},
				method: 'POST',
			});
			const data = resp.headers.get('content-type')?.includes('/json') ? await resp.json() : null;
			if (resp.status >= 400) {
				error = data?.message || `Failed (${resp.status})`;
				$toast = {
					text: error,
					type: 'error',
				};
				return;
			}
			if (data?.toast) {
				$toast = data.toast;
			}
			await invalidate($page.url.toString());

		} catch (err) {
			error = String(err);
			$toast = {
				text: error,
				type: 'error',
			};
			return;

		} finally {
			loading = false;
		}
	}
</script>

<div class="tooltip {$$restProps.class}" data-tip={error || action.label}>
	<a
		href={`/action/${action.id}`}
		class="btn btn-sm btn-primary"
		class:loading={loading}
		class:btn-circle={!!action.icon}
		class:btn-outline={!ghost}
		class:btn-ghost={ghost}
		on:click|preventDefault={() => onClick()}
		>
		{#if error}
			<Icon icon="error-warning-line" class="text-error" />
		{:else if action.icon}
			{#if !loading}
			<Icon icon={action.icon} />
			{/if}
		{:else}
			<span>{action.label}</span>
		{/if}
	</a>
</div>