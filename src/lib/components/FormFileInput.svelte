<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { formatPercent } from '$lib/format';

	export let name: string;
	export let image: boolean = false;
	export let options: { label: string, value: string }[] | undefined = void 0;
	export let value: string | undefined = void 0;

	const dispatch = createEventDispatcher();

	let file: File | undefined;
	let elInput: HTMLInputElement;
	let previewSrc: string | undefined = value;
	let uploading: boolean = false;
	let uploadError: string | undefined;
	let uploadProgress: number = 0;

	$: file && onFileChange();

	function onFileChange() {
		if (image && file?.type.includes('image/')) {
			previewSrc = URL.createObjectURL(file);
		}
		upload();
	}

	function onInputChange(ev: Event & { currentTarget: HTMLInputElement}) {
		file = ev.currentTarget.files?.[0];
	}

	function onRemoveClick() {
		value = void 0;
		file = void 0;
		previewSrc = void 0;
		uploading = false;
		uploadError = void 0;
		if (elInput) {
			elInput.value = '';
		}
	}

	async function upload() {
		if (file) {
			uploading = true;
			uploadError = void 0;
			uploadProgress = 0;
			try {
				const form = new FormData();
				form.append('options', JSON.stringify(options));
				form.append('file', file!);
				await new Promise((resolve, reject) => {
					const request = new XMLHttpRequest();
					request.addEventListener('load', () => {
						if (request.status >= 400) {
							return reject(new Error(`Request failed with status ${request.status}`));
						}
						let body: any = void 0;
						try {
							body = JSON.parse(request.responseText);
						} catch {
							// noop
						}
						if (body?.url) {
							value = body.url;
							dispatch('change', { value });
						}
						resolve(void 0);
					});
					request.upload.addEventListener('progress', (ev) => {
						uploadProgress = Math.round(ev.loaded / ev.total * 10) / 10;
					});
					request.open('POST', '/api/upload'); 
					request.send(form);
				});
			} catch (err) {
				console.log('Upload failed', err);
				uploadError = 'Upload failed';
				
			} finally {
				uploading = false;
			}
		}
	}
</script>

<div class="flex gap-3">
	{#if image}
	<div class="border rounded bg-base-200">
		<div class="rounded overflow-hidden h-20 w-20">
			{#if value || previewSrc}
			<img src={previewSrc || value} alt="" class="h-full w-full object-cover" />	
			{/if}
		</div>
	</div>
	{/if}

	<div class="flex-1">
		<div class="border rounded p-1">
			<input bind:this={elInput} type="file" class="text-sm" on:change={onInputChange} />
		</div>

		<div>
			{#if value || file}
			<button class="text-xs link" on:click|preventDefault={() => onRemoveClick()}>{$_('action.remove')}</button>
			{/if}

			{#if uploading}
			<div class="flex items-center gap-3 mt-1">
				<progress class="progress progress-primary h-1" value={uploadProgress} max="1"></progress>
				<div class="text-xs opacity-60 whitespace-nowrap">
					{formatPercent(uploadProgress * 100)}
				</div>
			</div>
			{/if}

			{#if uploadError}
			<div class="mt-1 text-xs text-error">{uploadError}</div>
			{/if}
		</div>
	</div>
</div>

<input type="hidden" {name} {value} />