<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import * as mathjs from 'mathjs';
	import { copyToClipboard, injectScript } from '$lib/helpers';
	import { toast } from '$lib/stores';
	import { debounce } from '$lib/helpers';
	import type { ISearchResultItem } from '$lib/types';

	export let buttons: any[];
	export let item: ISearchResultItem;

	const _onItemChange = debounce(onItemChange, 150);

	let entries: any[] = [];
	let error: any;
	let expression: string = '';
	let scope: any = {};
	let useMathJax: boolean = true;

	const defaultExpression = item.options?.expression;
	const defaultResult = item.options?.result;

	$: _onItemChange(item);

	if (item.options) {
		entries = [{
			expression: defaultExpression,
			result: defaultResult,
		}];
	}

	onMount(() => {
		buttons = [{
			dropdown: [{
				header: 'Settings',
			}, {
				label: 'Use MathJAX',
				handler(toggle: boolean) {
					// TODO: save
				},
				name: 'mathjax',
				type: 'toggle',
			}],
			icon: 'settings-4-line',
			label: 'Settings',
		}];
	});

	function copy(entry: any) {
		copyToClipboard(entry.result).then(() => {
			$toast = {
				text: 'Copied to clipboard',	
			};
		});
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter' && !ev.shiftKey) {
			ev.preventDefault();
			ev.stopPropagation();
			submit();
		}
	}

	function onItemChange(_item: ISearchResultItem) {
		if (item.options?.expression) {
			const _entries = entries;
			entries = [];
			evaluate(item.options?.expression, true).catch((e) => {
				entries = _entries;
			});
		}
	}

	function submit() {
		if (expression.trim()) {
			evaluate(expression).then(() => {
				expression = '';
			});
		}
	}

	async function evaluate(exp: string, rejectOnError: boolean = false) {
		error = null;
		const lines = exp.split(/\r?\n/).filter((line) => !!line);
		for (let line of lines) {
			try {
				if (useMathJax) {
					await evaluateMathJaxAsync(line);
				} else {
					await evaluateRaw(line);
				}
			} catch (err: any) {
				error = err.message;
				if (rejectOnError) {
					throw err;
				}
			}
		}
	}

	async function evaluateRaw(exp: string) {
		const result = mathjs.evaluate(exp, scope);
		entries = [...entries, {
			expression: exp,
			result: mathjs.format(result, {
				precision: 14,
			}),
		}];
	}

	async function evaluateMathJaxAsync(exp: string) {
		return injectScript('/vendor/mathjax-tex-svg.js').then(() => {
			const result = mathjs.evaluate(exp, scope);
			let svgExpression: HTMLElement | null = null;
			let svgResult: HTMLElement | null = null;
			try {
				const nodeExpression = mathjs.parse(exp, scope);
				const texExpression = nodeExpression.toTex({parenthesis: 'keep', implicit: 'hide'});
				MathJax.typesetClear();
				svgExpression = MathJax.tex2svg(texExpression, {em: 16, ex: 6, display: false});
			} catch (err) {
				// noop
			}
			try {
				const nodeResult = mathjs.parse(result.toString(), scope);
				const texResult = nodeResult.toTex({parenthesis: 'keep', implicit: 'hide'});
				MathJax.typesetClear();
				svgResult = MathJax.tex2svg(texResult, {em: 16, ex: 6, display: false});
			} catch (err) {
				// noop
			}
			entries = [...entries, {
				expression: exp,
				result: mathjs.format(result, {
					precision: 14,
				}),
				svgExpression: svgExpression?.outerHTML,
				svgResult: svgResult?.outerHTML,
			}];
		});
	}

	function removeEntry(entry: any) {
		entries = entries.filter((item) => item !== entry);
	}

</script>

<div class="mt-3">
	<div class="flex flex-col gap-6 mb-4">
		{#each entries as entry}
		<div class="rounded hover:outline outline-offset-4 outline-gray-200 hover:outline-1">
			<div class="flex border-l pl-6">
				<div class="flex-1">
					{#if entry.svgExpression}
					<div class="opacity-60 mb-3">
						{@html entry.svgExpression}
					</div>
					{:else if entry.expression}
					<div class="opacity-60 mb-2">
						{@html entry.expression}
					</div>
					{/if}

					{#if entry.svgResult}
					<div>
						{@html entry.svgResult}
					</div>
					{:else if entry.result !== void 0}
					<div>
						{@html entry.result}
					</div>
					{/if}
				</div>

				<div class="flex gap-1">
					{#if browser}
					<button class="btn btn-sm btn-ghost btn-circle opacity-25 hover:opacity-100" on:click={() => copy(entry)}>
						<i class="ri-file-copy-line"></i>
					</button>
					<button class="btn btn-sm btn-ghost btn-circle opacity-25 hover:opacity-100" on:click={() => removeEntry(entry)}>
						<i class="ri-close-line"></i>
					</button>
					{/if}
				</div>
			</div>
		</div>
		{/each}
	</div>

	{#if browser}
	<form class="flex items-start gap-4" on:submit|preventDefault={() => submit()}>
		<div class="flex-1">
			<textarea class="textarea textarea-bordered w-full" placeholder="Expression..." rows="1" bind:value={expression} on:keydown={onKeyDown}></textarea>

			<label class="label" for="">
				{#if error}
				<span class="label-text-alt text-error">{error}</span>
				{:else}
				<span class="label-text-alt">
					For syntax and examples see <a href="https://mathjs.org/docs/expressions/syntax.html">MathJS docs</a>.
				</span>
				{/if}
			</label> 
		</div>
		<button type="subnmit" class="btn btn-ghost btn-circle btn-sm">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-left" viewBox="0 0 16 16">
				<path fill-rule="evenodd" d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5z"/>
			</svg>
		</button>
	</form>
	{/if}
</div>
