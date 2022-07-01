<script lang="ts">
	export let icon: string | null = null;
	export let size: number = 16;
</script>

{#if icon?.match('^(https?\:|\/)')}
	<img {...$$restProps} src={icon} alt="" height={size} width={size}  />

{:else if icon}
	<i {...$$restProps} class="ri-{icon} {$$restProps.class}"></i>
{/if}

