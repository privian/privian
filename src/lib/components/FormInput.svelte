<script lang="ts">
	export let error: string | null = null;
	export let info: string | null = null;
	export let label: string | null = null;
	export let name: string;
	export let numeric: boolean = false;
	export let placeholder: string | null = null;
	export let readonly: boolean = false;
	export let required: boolean = false;
	export let tooltip: string | null = null;
	export let type: string = 'text';
	export let value: string | number | null = '';

	function onChange(ev: Event & { currentTarget: HTMLInputElement }) {
		value = ev.currentTarget.value;
		if (numeric && !value.match(/^\d{1,}(\.\d{1,})$/)) {
			value = String(parseFloat(value.replace(/\,/, '.')) || 0);
		}
	}
</script>

<div class="form-control w-full max-w-lg {$$restProps.class}">
	{#if label}
	<label class="label" for={name}>
		<span class="label-text text-gray-600">
			<span>{label}</span>
			{#if required}
			<span class="text-error">*</span>
			{/if}
		</span>
		{#if tooltip}
		<span class="tooltip tooltip-left text-gray-400" data-tip={tooltip}>
			<i class="ri-information-line"></i>
		</span>
		{/if}
	</label>
	{/if}

	<input
		id={name}
		{type}
		{name}
		{placeholder}
		{readonly}
		{required}
		{value}
		pattern={numeric ? '[0-9]' : void 0}
		class="input input-bordered w-full max-w-lg"
		class:input-error={error}
		on:change={onChange}
	/>

	{#if error || info}
	<label class="label" for={name}>
		<span class="label-text-alt text-error" class:text-error={error}>{error || info}</span>
	</label>
	{/if}
</div>