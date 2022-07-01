<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Modal from '$lib/components/Modal.svelte';
	import SerpPreview from '$lib/components/SerpPreview.svelte';
	import { previewItem } from '$lib/stores';
</script>

<Modal title={$_('label.preview')} open={$previewItem} size="fullscreen">
	<SerpPreview compact result={undefined} />	

	<div slot="actions">
	</div>
</Modal>