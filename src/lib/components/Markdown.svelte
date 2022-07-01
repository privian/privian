<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { marked } from 'marked';
	import { debounce } from '$lib/helpers';

	export let editable: boolean = false;
	export let progress: number | null = null;
	export let value: string | undefined;

	const dispatch = createEventDispatcher();
	const _onCheckboxChange = debounce(onCheckboxChange, 1);

	let checked: number = 0;
	let checkboxes: HTMLInputElement[];
	let elForm: HTMLElement;
	let tab: string = 'editor';

	marked.use({
		renderer: {
			heading(text: string, level: number) {
				return `<div class="mb-3 font-semibold${level === 1 ? ' text-lg' : ''}">${text.trim()}</div>`;
			},
			checkbox(checked: boolean) {
				return `<input type="checkbox" class="checkbox checkbox-xs animate-none" ${checked ? 'checked' : ''} />`;
			},
			listitem(text: string, task: boolean) {
				if (task) {
					return `<li class="task-list-item">${text}</li>`;
				}
				// use original renderer
				return false;
			},
		},
	});

	$: preview = (tab === 'preview' || !editable) ? marked.parse(value || '') : '';
	$: _onCheckboxChange(editable);
	$: _onCheckboxChange(value);

	onMount(() => {
		onCheckboxChange();
	});

	function onCheckboxChange(_value?: string) {
		if (elForm) {
			checkboxes = [].slice.apply(elForm.querySelectorAll('input[type="checkbox"]'));
			checked = checkboxes.filter((checkbox) => !!checkbox.checked).length;
			progress = checkboxes.length ? (checked / checkboxes.length) : null
			if (value) {
				// replace checked checkboxes with [x]
				let idx = -1;
				const newValue = value?.replace(/[\-\*\d+]\s+\[(\x|\v|\s)\]\s+/gm, (m) => {
					idx += 1;
					return m.replace(/\[(\x|\v|\s)\]/, `[${checkboxes[idx]?.checked ? 'x' : ' '}]`);
				});
				if (newValue !== value) {
					value = newValue;
				}
			}
			dispatch('progress', { progress });
		}
	}

	function onFormChange(ev: Event) {
		const target = ev.target as HTMLInputElement;
		if (target && target.matches('input[type="checkbox"]')) {
			const label = target.parentElement?.textContent;
			if (label) {
				onCheckboxChange();
				dispatch('checkbox', {
					checked: target.checked,
					label,
					index: checkboxes.indexOf(target),
					progress,
				});
			}
		}
	}
</script>

<div>
	{#if editable}
		<div class="relative flex flex-col">
			<textarea class="textarea w-full h-44" class:invisible={tab !== 'editor'} placeholder="Markdown" bind:value={value}></textarea>

			{#if tab === 'help'}
			<div class="absolute top-0 bottom-0 w-full border rounded px-4 py-2 overflow-auto text-sm {$$restProps.class}">
				Help
			</div>

			{:else if tab === 'preview'}
			<div class="absolute top-0 bottom-0 w-full border rounded px-4 py-2 overflow-auto text-sm {$$restProps.class}">
				{@html preview}
			</div>
			{/if}
		</div>

		<div class="flex justify-end">
			<ul class="menu menu-horizontal px-1">
				<li>
					<button class="link link-hover text-xs p-1" on:click={() => tab = 'editor'}>Editor</button>
				</li>
				<li>
					<button class="link link-hover text-xs p-1" on:click={() => tab = 'preview'}>Preview</button>
				</li>
				<li>
					<button class="link link-hover text-xs p-1" on:click={() => tab = 'help'}>?</button>
				</li>
			</ul>
		</div>

	{:else}
		<form bind:this={elForm} on:change={onFormChange}>
			<div {...$$restProps} on:dblclick={() => dispatch('dblclick')}>{@html preview}</div>
		</form>
	
		{#if progress !== null && progress !== void 0}
		<div class="mt-4 flex items-center gap-1">
			<progress class="progress w-full" class:progress-success={progress === 1} value={progress} max="1"></progress>
			<div class="whitespace-nowrap text-xs opacity-60 w-1/6 text-right">{checked} / {checkboxes.length}</div>
		</div>
		{/if}
	{/if}
</div>