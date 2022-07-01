<script lang="ts">
	export let error: string | null = null;
	export let label: string | null = null;
	export let name: string;
	export let required: boolean = false;
</script>

<div class="form-control mt-4">
	<label class="label p-0 cursor-pointer justify-start items-start gap-3">
		<input type="checkbox" {name} class="checkbox" {required} />
		<span class="label-text">{@html label}</span> 
	</label>

	{#if error}
	<label class="label" for={name}>
		<span class="label-text-alt text-error">{error}</span>
	</label>
	{/if}
</div>