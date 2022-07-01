<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { language, previewModalEnabled, region, safeSearchEnabled, searchHistoryEnabled, theme } from '$lib/stores';
	import locales from '$lib/data/locales'
</script>

<div class="p-4">
	<div class="font-semibold mb-3">
		{$_('label.settings')}
	</div>

	<div class="mb-3">
		<div class="form-control w-full max-w-md">
			<label class="label text-sm" for="language">{$_('label.region')}</label>
			<select name="language" class="select w-full" bind:value={$region}>
				{#each locales as item}
				<option value={item.locale}>{item.region} ({item.language})</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="mb-3">
		<div class="form-control w-full max-w-md">
			<label class="label text-sm" for="language">{$_('label.language')}</label>
			<select name="language" class="select w-full" bind:value={$language}>
				<option value="en">English</option>
			</select>
		</div>
	</div>

	<div class="mb-3">
		<div class="form-control w-full max-w-md">
			<label class="label text-sm" for="theme">{$_('label.theme')}</label>
			<select name="theme" class="select w-full" bind:value={$theme}>
				<option value="privian">Default</option>
			</select>
		</div>
	</div>

	<div class="mt-6"></div>

	<div class="mb-3">
		<label class="flex items-center gap-3 text-sm">
			<input type="checkbox" class="toggle toggle-xs" bind:checked={$safeSearchEnabled} /> {$_('label.safe_search')}
		</label>
	</div>

	<div class="mb-3">
		<label class="flex items-center gap-3 text-sm">
			<input type="checkbox" class="toggle toggle-xs" bind:checked={$searchHistoryEnabled} /> {$_('label.record_history')}
		</label>
	</div>

	<div class="mb-3">
		<label class="flex items-center gap-3 text-sm">
			<input type="checkbox" class="toggle toggle-xs" bind:checked={$previewModalEnabled} /> {$_('label.preview_in_modal')}
		</label>
	</div>
</div>