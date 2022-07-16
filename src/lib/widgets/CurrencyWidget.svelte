<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import FormInput from '$lib/components/FormInput.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import { formatCurrency, formatDate, formatNumber } from '$lib/format';
	import type { ISearchResultItem } from '$lib/types';

	interface IRate {
		date: string,
		rates: Record<string, number>;
	}

	export let item: ISearchResultItem<{
		amount: string;
		from: string;
		rates: IRate[];
		result: string;
		to: string;
	}>;

	let amount: number = parseFloat(item.options?.amount || '1');
	let currencyFrom: string = item.options?.from || 'USD';
	let currencyTo: string = item.options?.to || 'EUR';
	let rates: IRate[] = [];
	let result: number | null = parseFloat(item.options?.result || '1');

	$: currencies = ['EUR', ...Object.keys(rates[0]?.rates || {})];
	$: chartData = rates.reduce((acc, { date }, i) => {
		acc.push({
			date,
			value: getExchangeRate(currencyFrom, currencyTo, amount, i),
		});
		return acc;
	}, [] as any[]) || [];
	$: result = getExchangeRate(currencyFrom, currencyTo, amount);
	$: updatedAt = rates[0]?.date;
	$: item.subtitle = `${amount} ${formatCurrency(currencyFrom)}`;
	$: onFromChange(currencyFrom);

	onMount(() => {
		if (browser) {
			loadRates();
		}
	});

	function getExchangeRate(from: string, to: string, amount: number = 1, idx: number = 0) {
		const symbols = rates[idx]?.rates;
		if (!symbols) {
			return null;
		}
		if (from === to) {
			return 1;
		}
		let result: number;
		if (from === 'EUR' && symbols[to]) {
			result = symbols[to] * amount;
		} else if (to === 'EUR' && symbols[from]) {
			result = 1 / symbols[from] * amount;
		} else {
			result = (symbols[to] / symbols[from]) * amount;
		}
		const rounding = result < 1 ? 1000000 : 1000;
		return Math.round(result * rounding) / rounding;
	}

	function onFromChange(_from: string) {
		if (item?.subtitle) {
			item.subtitle = `${amount} ${formatCurrency(currencyFrom)}`;
		}
	}

	async function loadRates() {
		const resp = await fetch(`/api/provider/Currency/rates`);
		const json = await resp.json();
		rates = json.result;
		result = getExchangeRate(currencyFrom, currencyTo, amount);
	}

	function swap() {
		const from = currencyFrom;
		currencyFrom = currencyTo;
		currencyTo = from;
	}
</script>

<div class="flex flex-wrap items-end gap-4">
	<div class="w-80">
		{#if result}
		<div class="mb-4">
			<div class="text-2xl">
				{formatNumber(result)}
				<span>{formatCurrency(currencyTo)}</span>
				{#if browser}
				<button class="btn btn-ghost btn-sm btn-circle opacity-60 ml-1" on:click={() => swap()}>
					<i class="ri-exchange-line"></i>
				</button>
				{/if}
			</div>

			<div class="text-sm opacity-60">
				{formatDate(updatedAt)}{#if item.source}, {item.source}{/if}
			</div>
		</div>
		{/if}

		{#if browser}
		<div class="flex gap-2 mb-2">
			<div class="w-1/2">
				<FormInput
					field={{
						label: '',
						name: 'from',
					}}
					numeric
					lazz={false}
					bind:value={amount}
				/>
			</div>
			<div class="w-1/2">
				<select class="select select-bordered w-full max-w-xs" bind:value={currencyFrom}>
					{#each currencies as currency}
					<option value={currency} selected={item.options?.from === currency}>{formatCurrency(currency)} ({currency})</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex gap-2">
			<div class="w-1/2">
				<FormInput
					field={{
						label: '',
						name: 'to',
					}}
					numeric
					value={result}
				/>
			</div>
			<div class="w-1/2">
				<select class="select select-bordered w-full max-w-xs" bind:value={currencyTo}>
					{#each currencies as currency}
					<option value={currency} selected={item.options?.to === currency}>{formatCurrency(currency)} ({currency})</option>
					{/each}
				</select>
			</div>
		</div>
		{/if}
	</div>

	<div class="flex-1">
		{#if browser}
		<div class="border rounded shadow-sm p-2 max-w-xl overflow-hidden">
			<LineChart
				data={chartData}
				height={160}
				title={`${currencyFrom}/${currencyTo}`}
				tooltipFn={([ tick ]) => `<div class="p-1 text-xs">${tick.value} <span class="opacity-60 ml-3">${formatDate(tick.date)}</span></div>`}
			/>
		</div>
		{/if}
	</div>
</div>
