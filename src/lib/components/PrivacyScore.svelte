<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatNumber } from '$lib/format';

	export let iconOnly: boolean = false;
	export let score: number | null = null;

	$: privacyRisk = score && score < 3.5;
	$: privacyExcellent = score && score >= 7;
</script>

{#if privacyRisk || privacyExcellent || !iconOnly}
<span>
	{#if privacyRisk}
		<Icon icon="alert-fill" class="text-gray-500 align-bottom" />
	{:else if privacyExcellent}
		<Icon icon="shield-check-fill" class="text-success align-bottom" />
	{/if}

	{#if score && !iconOnly}
		<span>{formatNumber(score, { minimumFractionDigits: 1, maximumFractionDigits: 1})}</span>
	{/if}
</span>
{/if}