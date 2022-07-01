<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { prompt } from '$lib/stores';

	$: open = !!$prompt;

	function onCancelClick() {
		if ($prompt.handler) {
			$prompt.handler(false);
		}
		$prompt = null;
	}

	function onConfirmClick() {
		if ($prompt.handler) {
			$prompt.handler(true);
		}
		$prompt = null;
	}
</script>

<Modal title="Confirm" bind:open={open}>
	<div class="p-4">
		{@html $prompt.text}
	</div>

	<div slot="actions">
		<button class="btn btn-ghost px-8 rounded-none" on:click={() => onCancelClick()}>Cancel</button>
		<button class="btn btn-primary px-8 rounded-none flex-inline gap-3" on:click={() => onConfirmClick()}>Confirm</button>
	</div>
</Modal>