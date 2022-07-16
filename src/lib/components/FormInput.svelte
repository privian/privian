<script lang="ts">
	import FormFileInput from '$lib/components/FormFileInput.svelte';
	import type { IFormField } from '$lib/types';

	export let field: IFormField;
	export let error: string | null = null;
	export let numeric: boolean = false;
	export let value: string | string[] | number | null = field.value || null;
	export let lazy: boolean = true;

	$: label = typeof field.label === 'string' ? field.label : field.name;

	function onInputChange(ev: Event & { currentTarget: HTMLInputElement }) {
		value = ev.currentTarget?.value;
		if (numeric && value !== '' && !value.match(/^\d{1,}(\.\d{1,})$/)) {
			value = String(parseFloat(value.replace(/\,/, '.')) || 0);
		}
	}

	function onInputInput(ev: Event & { currentTarget: HTMLInputElement }) {
		if (!lazy) {
			onInputChange(ev);
		}
	}

	function onFileInputChange(ev: Event & { detail: { value: string }}) {
		value = ev.detail.value;
	}

	function onSelectChange(ev: Event & { currentTarget: HTMLSelectElement }) {
		value = ev.currentTarget.value;
	}

	function onTextareaChange(ev: Event & { currentTarget: HTMLTextAreaElement }) {
		value = ev.currentTarget.value;
	}
</script>

<div class="form-control w-full max-w-lg {$$restProps.class}">
	{#if label}
	<label class="label" for={field.name}>
		<span class="label-text text-gray-600">
			<span>{label}</span>
			{#if field.required}
			<span class="text-error">*</span>
			{/if}
		</span>
		{#if field.tooltip}
		<span class="tooltip tooltip-left text-gray-400" data-tip={field.tooltip}>
			<i class="ri-information-line"></i>
		</span>
		{/if}
	</label>
	{/if}

	{#if field.type === 'select'}
	<select
		id={field.name}
		name={field.name}
		required={field.required}
		readonly={field.readonly}
		{value}
		class="select select-bordered w-full max-w-lg"
		class:input-error={error}
		on:change={onSelectChange}
	>
		{#if field.options}
			{#each field.options as option}
				{#if typeof option === 'string'}
				<option value={option}>{option}</option>
				{:else}
				<option value={option.value}>{option.label}</option>
				{/if}
			{/each}
		{/if}
	</select>

	{:else if field.type === 'textarea'}
	<textarea
		name={field.name}
		placeholder={field.placeholder}
		required={field.required}
		readonly={field.readonly}
		value={field.value || ''}
		rows="3"
		class="textarea textarea-bordered w-full max-w-lg"
		class:input-error={error}
		on:change={onTextareaChange}
	></textarea>

	{:else if field.type === 'toggle'}
	<input
	 	name={field.name}
		type="checkbox"
		class="toggle toggle-primary toggle-sm"
		checked={!!field.value}
	/>

	{:else if field.type === 'checkbox'}
	<input
	 	name={field.name}
		type="checkbox"
		class="checkbox checkbox-primary checkbox-sm"
		checked={!!field.value}
	/>

	{:else if field.type === 'multicheckbox' && field.options && Array.isArray(field.value)}
		{#each field.options as option, i}
		<div class="flex gap-2 mb-2">
			<input
				name={field.name + `[${option.value}]`}
				type="checkbox"
				class="checkbox checkbox-primary checkbox-sm"
				checked={!!field.value[i]}
			/>
			<div class="text-sm">{option.label}</div>
		</div>
		{/each}

	{:else if field.type === 'image'}
	<FormFileInput
		name={field.name}
		value={field.value ? String(field.value) : void 0}
		image
		options={field?.options}
		on:change={onFileInputChange}
	/>

	{:else if field.type === 'file'}
	<FormFileInput
		name={field.name}
		value={field.value ? String(field.value) : void 0}
		options={field?.options}
		on:change={onFileInputChange}
	/>

	{:else}
	<input
		id={field.name}
		type={field.type}
		name={field.name}
		placeholder={field.placeholder}
		required={field.required}
		readonly={field.readonly}
		{value}
		pattern={numeric ? '[0-9]' : void 0}
		class="input input-bordered w-full max-w-lg"
		class:input-error={error}
		on:change={onInputChange}
		on:input={onInputInput}
	/>
	{/if}

	{#if error || field.info}
	<label class="label" for={field.name}>
		<span class="label-text-alt text-error" class:text-error={error}>{error || field.info}</span>
	</label>
	{/if}
</div>