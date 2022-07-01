<script lang="ts">
	export let alt: string = '';
	export let src: string;
	export let proxy: boolean = true;

	$: proxySrc = proxy ? `/api/proxy/${encodeURIComponent(src)}` : src;

	function onError(ev: Event) {
		// @ts-ignore
		ev.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
	}
</script>

<img src={proxySrc} data-src={src} alt={alt} {...$$restProps} on:error={onError} />