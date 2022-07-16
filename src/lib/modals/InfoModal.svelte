<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Modal from '$lib/components/Modal.svelte';
	import PrivacyScore from '$lib/components/PrivacyScore.svelte';
	import { formatLanguage } from '$lib/format';
	import { info } from '$lib/stores';
	import { Pins } from '$lib/pins';

	$: item = $info;

	function onPinClick() {
		Pins.create({
			icon: 'pushpin-fill',
			...item,
			options: {
				pin: true,
				...item?.options,
			},
		});
		$info = null;
	}
</script>

<Modal title={$_('label.result_info')} bind:open={$info}>
	{#if item}
	<div class="p-4 pb-0">
		<div class="font-semibold">
			{item.title}
		</div>

		<div class="flex items-center gap-6">
			<div class="text-sm">
				<span class="opacity-60">{$_('label.privacy_score')}:</span>
				{#if item.privacyScore !== void 0}
				<PrivacyScore score={item.privacyScore} />
				{:else}
				<span>
					?
					<a href="/">{$_('action.contribute')}</a>
				</span>
				{/if}
			</div>

			<button class="btn btn-sm btn-link icon gap-3 px-0" on:click={() => onPinClick()}>
				<i class="ri-pushpin-line"></i>
				<span>{$_('action.pin')}</span>
			</button>
		</div>

		<div class="mt-4">
			<div class="border rounded flex items-center gap-3 pr-2">
				<div class="flex-1">
					<input type="text" class="input input-ghost border-0 w-full" value={item.link} readonly />
				</div>
				<div>
					<button class="btn btn-ghost btn-circle btn-sm">
						<i class="ri-file-copy-line"></i>
					</button>
				</div>
			</div>
		</div>

		<div class="mt-8 grid grid-cols-2 gap-4">
			{#if item.source}
			<div>
				<div class="text-sm opacity-60">{$_('label.source')}</div>
				<div class="text-sm">{item.source}</div>
			</div>
			{/if}

			{#if item.crawledAt}
			<div>
				<div class="text-sm opacity-60">{$_('label.crawled')}</div>
				<div class="text-sm">{item.crawledAt}</div>
			</div>
			{/if}

			{#if item.language}
			<div>
				<div class="text-sm opacity-60">{$_('label.language')}</div>
				<div class="text-sm">{formatLanguage(item.language)}</div>
			</div>
			{/if}

			{#if item.safe !== void 0}
			<div>
				<div class="text-sm opacity-60">{$_('label.family_friendly')}</div>
				<div class="text-sm">{$_('label.' + item.safe ? 'yes' : 'no')}</div>
			</div>
			{/if}

			{#if item.metadata}
				{#each item.metadata as meta}
				<div>
					<div class="text-sm opacity-60">{meta.name}</div>

					{#if meta.link}
					<div class="text-sm">
						<a href={meta.link}>{meta.value}</a>
					</div>
					{:else}
					<div class="text-sm">{meta.value}</div>
					{/if}
				</div>
				{/each}
			{/if}
		</div>
	</div>
	{/if}

	<div slot="actions">
		<label for="" class="btn btn-ghost rounded-none" on:click={() => $info = null}>{$_('action.close')}</label>
	</div>
</Modal>