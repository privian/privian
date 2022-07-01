<script lang="ts">
	export let loading: boolean = false;
	export let type: string = 'submit';
</script>

<button {type} class="btn {$$restProps.class}" class:loading={loading} disabled={loading}>
	<slot></slot>
</button>